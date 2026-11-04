"""Fine-resolution envelope (50 fps) and 12-band spectrum (20 fps) for the comparison page.
Usage: python fine.py <mono 22 kHz wav> <out.json>"""
import sys, json, base64
import numpy as np, soundfile as sf, librosa
y, sr = sf.read(sys.argv[1], dtype="float32"); assert sr == 22000
# envelope: RMS over 20 ms
env = librosa.feature.rms(y=y, frame_length=880, hop_length=440, center=True)[0]
env_db = 20 * np.log10(env + 1e-6)
env_u8 = np.clip((env_db + 90) / 90 * 255, 0, 255).astype(np.uint8)
# 12 log-spaced bands, 40 Hz - 10 kHz, 50 ms hop (triangular filters on the STFT)
P = np.abs(librosa.stft(y, n_fft=2048, hop_length=1100)) ** 2
freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
edges = np.geomspace(40, 10000, 14)
fb = np.zeros((12, len(freqs)), dtype=np.float32)
for i in range(12):
    lo, c, hi = edges[i], edges[i + 1], edges[i + 2]
    fb[i] = np.clip(np.minimum((freqs - lo) / (c - lo), (hi - freqs) / (hi - c)), 0, None)
fb /= fb.sum(1, keepdims=True) + 1e-12
M = fb @ P
M_db = 10 * np.log10(M + 1e-10)
lo_db, hi_db = float(np.percentile(M_db, 0.5)), float(np.percentile(M_db, 99.95))
band_u8 = np.clip((M_db - lo_db) / (hi_db - lo_db) * 255, 0, 255).astype(np.uint8)
del P
out = dict(env_fps=50, band_fps=20, n_bands=12, band_hz=[round(float(f)) for f in edges[1:-1]],
           env_db_range=[-90, 0], band_db_range=[round(lo_db, 1), round(hi_db, 1)],
           env=base64.b64encode(env_u8.tobytes()).decode(), bands=base64.b64encode(band_u8.T.copy().tobytes()).decode(),
           n_env=int(len(env_u8)), n_frames=int(M.shape[1]))
json.dump(out, open(sys.argv[2], "w"), separators=(",", ":"))
print(len(env_u8), M.shape, "band centres", out["band_hz"])
