"""Self-contained YAMNet inference (architecture re-implemented from the
published description; only the pretrained weight file is loaded).

Usage: python yam.py <yamnet.h5> <mono16k.wav> <out_scores.npy> [<out_emb.npy>]
Output: scores (n_patches, 521) at 0.48 s hop, each patch = 0.96 s window.
"""
import sys
import numpy as np
import h5py
import soundfile as sf
import tensorflow as tf

EPS = 1e-4
STRIDES = [2, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1]   # layer1 .. layer14

f = h5py.File(sys.argv[1], "r")
W = lambda p: tf.constant(f[p][()])


def bn(x, p):
    return (x - W(p + "/moving_mean:0")) / tf.sqrt(W(p + "/moving_variance:0") + EPS) + W(p + "/beta:0")


def net(x):
    for i, s in enumerate(STRIDES, 1):
        L = f"layer{i}"
        if i == 1:
            x = tf.nn.conv2d(x, W(f"{L}/conv/{L}/conv/kernel:0"), s, "SAME")
            x = tf.nn.relu(bn(x, f"{L}/conv/bn/{L}/conv/bn"))
        else:
            x = tf.nn.depthwise_conv2d(x, W(f"{L}/depthwise_conv/{L}/depthwise_conv/depthwise_kernel:0"), [1, s, s, 1], "SAME")
            x = tf.nn.relu(bn(x, f"{L}/depthwise_conv/bn/{L}/depthwise_conv/bn"))
            x = tf.nn.conv2d(x, W(f"{L}/pointwise_conv/{L}/pointwise_conv/kernel:0"), 1, "SAME")
            x = tf.nn.relu(bn(x, f"{L}/pointwise_conv/bn/{L}/pointwise_conv/bn"))
    emb = tf.reduce_mean(x, axis=[1, 2])
    logits = tf.matmul(emb, W("logits/logits/kernel:0")) + W("logits/logits/bias:0")
    return tf.sigmoid(logits), emb


MEL = tf.signal.linear_to_mel_weight_matrix(64, 257, 16000, 125.0, 7500.0)


def patches(w):
    mag = tf.abs(tf.signal.stft(w, 400, 160, 512))
    logmel = tf.math.log(tf.matmul(mag, MEL) + 0.001)
    return tf.signal.frame(logmel, 96, 48, axis=0)[..., None]   # (n, 96, 64, 1)


w, sr = sf.read(sys.argv[2], dtype="float32")
assert sr == 16000 and w.ndim == 1
P = patches(tf.constant(w))
S, E = [], []
for i in range(0, P.shape[0], 512):
    s, e = net(P[i:i + 512])
    S.append(s.numpy()); E.append(e.numpy())
    print(i, "/", P.shape[0], flush=True)
S = np.vstack(S)
np.save(sys.argv[3], S.astype(np.float16))
if len(sys.argv) > 4:
    np.save(sys.argv[4], np.vstack(E).astype(np.float16))
print(S.shape)
