"""The net that learns, trained for real and recorded step by step.

A small network (a pixel's place in, its brightness out) starts from random numbers and learns to
draw one picture by gradient descent. Nothing is downloaded: the picture (an eye) is drawn here.

    python tools/red.py src/datos/red.json [preview.png]

Output (JSON): `lado` (the picture is lado × lado), `conexiones` (how many numbers the net has),
`pasos` (the training step of each recorded frame), `error` (its mean squared error) and `cuadros`
(base64: one byte per pixel per frame, what the net draws at that step).
"""
import base64
import json
import sys

import numpy as np

LADO = 80
CUADROS = 44
PASOS = 3000


def ojo(n):
    """An eye, drawn in light on black."""
    y, x = np.mgrid[0:n, 0:n]
    x = (x + 0.5) / n * 2 - 1
    y = 1 - (y + 0.5) / n * 2
    x = x / 0.92
    a = np.clip(1 - x * x, 0, 1)
    arriba = 0.50 * a**0.75 + 0.05 * x * a
    abajo = -0.34 * a**0.9 + 0.03 * x * a
    dentro = (y < arriba) & (y > abajo) & (np.abs(x) < 1)
    img = np.zeros((n, n))
    # The white of the eye, darker under the lid and at the corners.
    img[dentro] = (0.34 * (0.45 + 0.55 * a) * (1 - 0.5 * np.clip((y - arriba + 0.22) / 0.22, 0, 1)))[dentro]
    cy = 0.07
    r = np.hypot(x, y - cy)
    th = np.arctan2(y - cy, x)
    R = 0.40
    fibras = 0.5 + 0.5 * np.sin(th * 26 + 2.2 * np.sin(th * 5) + r * 9)
    iris = 0.42 + 0.34 * fibras * np.clip((r - 0.13) / 0.12, 0, 1) + 0.25 * np.exp(-(((r - 0.2) / 0.06) ** 2))
    iris *= 1 - 0.85 * np.clip((r - R + 0.07) / 0.07, 0, 1) ** 2
    m = dentro & (r < R)
    img[m] = iris[m]
    img[dentro & (r < 0.135)] = 0.0
    # The light in it.
    img[dentro] = np.maximum(img, np.exp(-(((x + 0.13) ** 2 + (y - cy - 0.15) ** 2) / 0.0035)))[dentro]
    # The lids: two lines of light, and a fold above.
    for curva, ancho, luz in ((arriba, 0.035, 0.95), (abajo, 0.022, 0.6), (arriba + 0.2 * a**0.5 + 0.03, 0.02, 0.32)):
        linea = luz * np.exp(-(((y - curva) / ancho) ** 2)) * np.clip(a * 6, 0, 1)
        img = np.maximum(img, linea)
    return np.clip(img, 0, 1)


def main():
    rng = np.random.default_rng(7)
    T = ojo(LADO).reshape(-1, 1)
    g = (np.arange(LADO) + 0.5) / LADO
    xy = np.stack(np.meshgrid(g, g), -1).reshape(-1, 2)
    # The place of each pixel, written as waves (fixed; they are not learned).
    B = rng.normal(0, 9.0, (2, 64))
    F = np.concatenate([np.sin(2 * np.pi * xy @ B), np.cos(2 * np.pi * xy @ B)], 1)
    capas = [128, 96, 96, 1]
    Wb = []
    for i in range(3):
        k = 2.6 if i == 2 else 1.0
        Wb.append(rng.normal(0, k / np.sqrt(capas[i]), (capas[i], capas[i + 1])))
        Wb.append(np.zeros(capas[i + 1]))
    conexiones = int(sum(w.size for w in Wb))

    def pasar(p):
        h1 = np.tanh(F @ p[0] + p[1])
        h2 = np.tanh(h1 @ p[2] + p[3])
        o = 1 / (1 + np.exp(-(h2 @ p[4] + p[5])))
        return h1, h2, o

    m = [np.zeros_like(w) for w in Wb]
    v = [np.zeros_like(w) for w in Wb]
    lr, b1, b2 = 0.0012, 0.9, 0.999
    guardar = sorted(set([0] + [int(round(PASOS ** (i / (CUADROS - 1)))) for i in range(CUADROS)]))
    pasos, error, cuadros = [], [], []
    n = len(T)
    for t in range(PASOS + 1):
        h1, h2, o = pasar(Wb)
        if t in guardar:
            pasos.append(t)
            error.append(float(((o - T) ** 2).mean()))
            cuadros.append(np.round(o[:, 0] * 255).astype(np.uint8))
        do = 2 * (o - T) / n * o * (1 - o)
        g4 = h2.T @ do
        d2 = (do @ Wb[4].T) * (1 - h2 * h2)
        g2 = h1.T @ d2
        d1 = (d2 @ Wb[2].T) * (1 - h1 * h1)
        g0 = F.T @ d1
        grads = [g0, d1.sum(0), g2, d2.sum(0), g4, do.sum(0)]
        for i, gr in enumerate(grads):
            m[i] = b1 * m[i] + (1 - b1) * gr
            v[i] = b2 * v[i] + (1 - b2) * gr * gr
            Wb[i] = Wb[i] - lr * (m[i] / (1 - b1 ** (t + 1))) / (np.sqrt(v[i] / (1 - b2 ** (t + 1))) + 1e-8)
    print(f"{conexiones} conexiones, {len(pasos)} cuadros, error {error[0]:.3f} -> {error[-1]:.5f}", file=sys.stderr)
    datos = {
        "lado": LADO,
        "conexiones": conexiones,
        "pasos": pasos,
        "error": [round(e, 5) for e in error],
        "cuadros": base64.b64encode(np.concatenate(cuadros).tobytes()).decode(),
    }
    with open(sys.argv[1], "w", encoding="utf-8") as f:
        json.dump(datos, f, separators=(",", ":"))
    if len(sys.argv) > 2:
        from PIL import Image

        cols = 11
        filas = -(-len(cuadros) // cols)
        hoja = np.zeros((filas * LADO, cols * LADO), np.uint8)
        for i, c in enumerate(cuadros):
            hoja[(i // cols) * LADO : (i // cols + 1) * LADO, (i % cols) * LADO : (i % cols + 1) * LADO] = c.reshape(LADO, LADO)
        Image.fromarray(hoja).resize((cols * LADO * 2, filas * LADO * 2), Image.NEAREST).save(sys.argv[2])


main()
