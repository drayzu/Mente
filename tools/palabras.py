"""The galaxy of meanings, precomputed: real word vectors projected to 3D.

Source: fastText Spanish vectors trained on Common Crawl and Wikipedia (Grave et al. 2018,
CC BY-SA 3.0), https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.es.300.vec.gz. The file is
sorted by frequency, so the first megabytes are enough (a truncated download is fine).

    python -I tools/palabras.py <cc.es.300.vec.gz or a truncated part> src/datos/palabras.json [n]

Output (JSON): `palabras` (most frequent first), `pos` (x, y, z per word, integers in ±32767 for
±1), `grupo` (a k-means region per word, in the full space) and `vecinas` (the three nearest words
of each in the original 300 dimensions, by cosine).
"""
import json
import re
import sys
import zlib

import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE

src, out = sys.argv[1], sys.argv[2]
N = int(sys.argv[3]) if len(sys.argv) > 3 else 6000
GRUPOS = 24

# Function words say little about meaning and crowd the centre.
VACIAS = set(
    """que los las del por con una para como pero sus les más mas este esta estos estas ese esa esos
    esas aquel aquella sin sobre entre cuando muy también tambien hasta desde donde quien quienes cual
    cuales porque aunque mientras sino pues así asi tan tanto tanta tantos tantas cada otro otra otros
    otras mismo misma mismos mismas todo toda todos todas algo alguien algún algun alguna algunos
    algunas ningún ningun ninguna nada nadie mucho mucha muchos muchas poco poca pocos pocas ante bajo
    contra hacia según segun tras durante mediante además ademas luego entonces aún aun ya sólo solo
    solamente cuyo cuya cuyos cuyas the and for you are not this that with from uno unos unas nos
    han has había habían habia habian hay ser sido era eran fue fueron son está están esta estan
    estaba estaban sea sean será serán puede pueden tiene tienen the was his her""".split()
)
PALABRA = re.compile(r"^[a-záéíóúüñ]{3,13}$")


def lineas(path):
    """Lines of a gzip file that may be cut short."""
    d = zlib.decompressobj(31)
    resto = b""
    with open(path, "rb") as f:
        while True:
            trozo = f.read(1 << 20)
            if not trozo:
                break
            try:
                resto += d.decompress(trozo)
            except zlib.error:
                break
            *completas, resto = resto.split(b"\n")
            for l in completas:
                yield l.decode("utf-8", "replace")


palabras, vecs = [], []
for i, l in enumerate(lineas(src)):
    if i == 0:
        continue
    w, _, resto = l.partition(" ")
    if not PALABRA.match(w) or w in VACIAS:
        continue
    v = np.array(resto.split(), dtype=np.float32)
    if v.shape[0] != 300:
        continue
    palabras.append(w)
    vecs.append(v)
    if len(palabras) >= N:
        break

X = np.stack(vecs)
X /= np.linalg.norm(X, axis=1, keepdims=True)
sys.stderr.reconfigure(encoding="utf-8")
print(f"{len(palabras)} palabras", palabras[:20], palabras[-10:], file=sys.stderr)

# Nearest neighbours in the full space.
vecinas = np.zeros((len(palabras), 3), dtype=int)
for a in range(0, len(palabras), 2000):
    S = X[a : a + 2000] @ X.T
    S[np.arange(S.shape[0]), np.arange(a, a + S.shape[0])] = -1
    vecinas[a : a + 2000] = np.argsort(-S, axis=1)[:, :3]

Z = PCA(n_components=50, random_state=7).fit_transform(X)
grupo = KMeans(n_clusters=GRUPOS, n_init=10, random_state=7).fit_predict(Z)
P = TSNE(n_components=3, perplexity=32, init="pca", learning_rate="auto", random_state=7, metric="cosine").fit_transform(Z)
P -= P.mean(axis=0)
P /= np.abs(P).max()

for g in range(GRUPOS):
    print(g, [palabras[i] for i in np.where(grupo == g)[0][:14]], file=sys.stderr)

with open(out, "w", encoding="utf-8") as f:
    json.dump(
        {
            "fuente": "fastText cc.es.300 (Grave et al. 2018), CC BY-SA 3.0",
            "palabras": palabras,
            "pos": np.round(P * 32767).astype(int).ravel().tolist(),
            "grupo": grupo.tolist(),
            "vecinas": vecinas.ravel().tolist(),
        },
        f,
        ensure_ascii=False,
        separators=(",", ":"),
    )
