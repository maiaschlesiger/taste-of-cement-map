"""Extract per-window acoustic features from the film's soundtrack.

Usage: python extract.py <stereo wav> <out.npz>
Processes audio in 60 s chunks; outputs features at 0.5 s resolution
plus a frame-level onset/impact list.
"""
import sys
import numpy as np
import soundfile as sf
import librosa

SR = 22050
N_FFT = 2048
HOP = 512                      # ~23 ms
WIN_S = 0.5                    # output resolution
CHUNK_S = 60

path, out = sys.argv[1], sys.argv[2]
info = sf.info(path)
total = info.frames
freqs = librosa.fft_frequencies(sr=SR, n_fft=N_FFT)
band = lambda lo, hi: (freqs >= lo) & (freqs < hi)
B_SUB, B_LOW, B_MID, B_PRES, B_HIGH = band(20, 80), band(80, 250), band(250, 2000), band(2000, 5000), band(5000, 11025)

frames_per_win = int(round(WIN_S * SR / HOP))   # ~21.5 -> 22

rows = []          # frame-level feature rows
for start in range(0, total, CHUNK_S * SR):
    y, _ = sf.read(path, start=start, frames=CHUNK_S * SR + N_FFT, dtype="float32", always_2d=True)
    L, R = y[:, 0], y[:, 1]
    m = 0.5 * (L + R)
    s = 0.5 * (L - R)
    S = np.abs(librosa.stft(m, n_fft=N_FFT, hop_length=HOP))
    P = S ** 2
    Ss = np.abs(librosa.stft(s, n_fft=N_FFT, hop_length=HOP)) ** 2
    H, Pc = librosa.decompose.hpss(S, margin=1.0)
    tot = P.sum(0) + 1e-12
    rms = librosa.feature.rms(S=S, frame_length=N_FFT)[0]
    peak = librosa.util.frame(np.pad(np.abs(m), (N_FFT // 2, N_FFT // 2)), frame_length=N_FFT, hop_length=HOP).max(0)[: S.shape[1]]
    onset = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S, ref=1.0), sr=SR)
    # low-frequency flux: energy jumps in the sub/low register (thuds, booms, slams)
    lowE = P[B_SUB | B_LOW].sum(0)
    lowdb = 10 * np.log10(lowE + 1e-10)
    lowflux = np.maximum(0, np.diff(lowdb, prepend=lowdb[0]))
    feat = np.vstack([
        rms,
        peak,
        P[B_SUB].sum(0) / tot,
        P[B_LOW].sum(0) / tot,
        P[B_MID].sum(0) / tot,
        P[B_PRES].sum(0) / tot,
        P[B_HIGH].sum(0) / tot,
        librosa.feature.spectral_centroid(S=S, sr=SR)[0],
        librosa.feature.spectral_flatness(S=S)[0],
        librosa.feature.spectral_rolloff(S=S, sr=SR, roll_percent=0.85)[0],
        (Pc ** 2).sum(0) / ((H ** 2).sum(0) + (Pc ** 2).sum(0) + 1e-12),
        Ss.sum(0) / (P.sum(0) + Ss.sum(0) + 1e-12),
        onset,
        lowflux,
        lowdb,
    ])
    mf = librosa.feature.mfcc(S=librosa.power_to_db(librosa.feature.melspectrogram(S=P, sr=SR, n_mels=64)), n_mfcc=13)
    nkeep = min(int(np.ceil(min(CHUNK_S * SR, total - start) / HOP)), feat.shape[1])
    rows.append(np.vstack([feat, mf])[:, :nkeep])
    print(f"{start / SR / 60:5.1f} min", flush=True)

F = np.hstack(rows)            # (15+13, nframes)
np.save(out.replace(".npz", "_frames.npy"), F.astype(np.float32))
print("frames", F.shape)
