"""What the meanings hold without anyone teaching it: one arrow shared by many pairs of words, and
a map of the world.

Source of the vectors: fastText Spanish (Grave et al. 2018, CC BY-SA 3.0), the same file as
tools/palabras.py. The land comes from any equirectangular map of the Earth in true colour.

    python -I tools/lugares.py <cc.es.300.vec.gz or a part> src/datos/palabras.json <earth.jpg> src/datos/lugares.json

Output (JSON):
- `pares`: pairs of words (king and queen, man and woman...) with each word's index in
  palabras.json and its place in a view of three directions of the 300: the first is the mean
  arrow of all the pairs, the other two are where the pairs differ most among themselves
  (Mikolov et al. 2013). Nothing is moved by hand: it is a projection.
- `lugares`: names of places with where they are (lat, lon) and where a linear probe says they are
  from the word's vector alone, trained on all the *other* places (Gurnee & Tegmark 2023, on a far
  smaller scale). `origen` is the index in palabras.json of the nearest word.
- `tierra`: points on land (lat, lon in hundredths of a degree), evenly over the sphere.
"""
import json
import sys
import zlib

import numpy as np

PARES = [
    ("rey", "reina"), ("hombre", "mujer"), ("padre", "madre"), ("tío", "tía"), ("abuelo", "abuela"),
    ("hermano", "hermana"), ("príncipe", "princesa"), ("actor", "actriz"), ("niño", "niña"),
]

LUGARES = {
 # América
 'Chile': (-33.4, -70.7), 'Santiago': (-33.4, -70.7), 'Argentina': (-34.6, -58.4), 'Uruguay': (-34.9, -56.2), 'Paraguay': (-25.3, -57.6),
 'Bolivia': (-16.5, -68.1), 'Perú': (-12.0, -77.0), 'Lima': (-12.0, -77.0), 'Ecuador': (-0.2, -78.5), 'Quito': (-0.2, -78.5), 'Colombia': (4.7, -74.1), 'Bogotá': (4.7, -74.1),
 'Venezuela': (10.5, -66.9), 'Caracas': (10.5, -66.9), 'Brasil': (-15.8, -47.9), 'Panamá': (9.0, -79.5), 'Nicaragua': (12.1, -86.3), 'Honduras': (14.1, -87.2),
 'Guatemala': (14.6, -90.5), 'México': (19.4, -99.1), 'Cuba': (23.1, -82.4), 'Habana': (23.1, -82.4), 'Canadá': (45.4, -75.7), 'Toronto': (43.7, -79.4), 'Montreal': (45.5, -73.6),
 'Washington': (38.9, -77.0), 'Chicago': (41.9, -87.6), 'Miami': (25.8, -80.2), 'California': (36.8, -119.4), 'Texas': (31.0, -99.0), 'Florida': (27.8, -81.7),
 'Montevideo': (-34.9, -56.2), 'Medellín': (6.2, -75.6), 'Guadalajara': (20.7, -103.3), 'Monterrey': (25.7, -100.3), 'Valparaíso': (-33.0, -71.6), 'Rosario': (-32.9, -60.7),
 'Alaska': (64.2, -149.5), 'Haití': (18.6, -72.3), 'Jamaica': (18.0, -76.8), 'Boston': (42.4, -71.1), 'Houston': (29.8, -95.4), 'Vancouver': (49.3, -123.1),
 # Europa
 'España': (40.4, -3.7), 'Madrid': (40.4, -3.7), 'Barcelona': (41.4, 2.2), 'Sevilla': (37.4, -6.0), 'Valencia': (39.5, -0.4), 'Portugal': (38.7, -9.1), 'Lisboa': (38.7, -9.1),
 'Francia': (48.9, 2.4), 'París': (48.9, 2.4), 'Italia': (41.9, 12.5), 'Roma': (41.9, 12.5), 'Milán': (45.5, 9.2), 'Alemania': (52.5, 13.4), 'Berlín': (52.5, 13.4),
 'Inglaterra': (51.5, -0.1), 'Londres': (51.5, -0.1), 'Irlanda': (53.3, -6.3), 'Escocia': (56.0, -3.2), 'Holanda': (52.4, 4.9), 'Bélgica': (50.8, 4.4), 'Bruselas': (50.8, 4.4),
 'Suiza': (46.9, 7.4), 'Austria': (48.2, 16.4), 'Viena': (48.2, 16.4), 'Polonia': (52.2, 21.0), 'Varsovia': (52.2, 21.0), 'Suecia': (59.3, 18.1), 'Noruega': (59.9, 10.8),
 'Finlandia': (60.2, 24.9), 'Dinamarca': (55.7, 12.6), 'Grecia': (38.0, 23.7), 'Atenas': (38.0, 23.7), 'Rusia': (55.8, 37.6), 'Moscú': (55.8, 37.6), 'Ucrania': (50.5, 30.5),
 'Hungría': (47.5, 19.0), 'Rumania': (44.4, 26.1), 'Bulgaria': (42.7, 23.3), 'Serbia': (44.8, 20.5), 'Croacia': (45.8, 16.0), 'Islandia': (64.1, -21.9), 'Praga': (50.1, 14.4),
 'Ámsterdam': (52.4, 4.9), 'Estocolmo': (59.3, 18.1), 'Múnich': (48.1, 11.6), 'Venecia': (45.4, 12.3), 'Florencia': (43.8, 11.3), 'Nápoles': (40.9, 14.3), 'Bilbao': (43.3, -2.9),
 # África
 'Marruecos': (34.0, -6.8), 'Argelia': (36.8, 3.1), 'Túnez': (36.8, 10.2), 'Libia': (32.9, 13.2), 'Egipto': (30.0, 31.2), 'Cairo': (30.0, 31.2), 'Sudán': (15.6, 32.5),
 'Etiopía': (9.0, 38.7), 'Kenia': (-1.3, 36.8), 'Tanzania': (-6.8, 39.3), 'Nigeria': (9.1, 7.5), 'Ghana': (5.6, -0.2), 'Senegal': (14.7, -17.5), 'Congo': (-4.3, 15.3),
 'Angola': (-8.8, 13.2), 'Sudáfrica': (-26.2, 28.0), 'Mozambique': (-25.9, 32.6), 'Madagascar': (-18.9, 47.5), 'Somalia': (2.0, 45.3), 'Uganda': (0.3, 32.6), 'Camerún': (3.9, 11.5), 'Mali': (12.6, -8.0),
 # Asia y Oceanía
 'Turquía': (39.9, 32.9), 'Estambul': (41.0, 29.0), 'Israel': (31.8, 35.2), 'Jerusalén': (31.8, 35.2), 'Siria': (33.5, 36.3), 'Irak': (33.3, 44.4), 'Bagdad': (33.3, 44.4),
 'Irán': (35.7, 51.4), 'Arabia': (24.7, 46.7), 'Afganistán': (34.5, 69.2), 'Pakistán': (33.7, 73.1), 'India': (28.6, 77.2), 'Nepal': (27.7, 85.3), 'China': (39.9, 116.4),
 'Pekín': (39.9, 116.4), 'Shanghái': (31.2, 121.5), 'Japón': (35.7, 139.7), 'Tokio': (35.7, 139.7), 'Corea': (37.6, 127.0), 'Seúl': (37.6, 127.0), 'Mongolia': (47.9, 106.9),
 'Vietnam': (21.0, 105.8), 'Tailandia': (13.8, 100.5), 'Indonesia': (-6.2, 106.8), 'Filipinas': (14.6, 121.0), 'Malasia': (3.1, 101.7), 'Singapur': (1.3, 103.8),
 'Australia': (-33.9, 151.2), 'Sídney': (-33.9, 151.2), 'Melbourne': (-37.8, 145.0), 'Taiwán': (25.0, 121.5), 'Líbano': (33.9, 35.5), 'Kazajistán': (51.2, 71.4),
 'Siberia': (60.0, 105.0), 'Tíbet': (29.7, 91.1), 'Bangladesh': (23.8, 90.4), 'Camboya': (11.6, 104.9), 'Dubái': (25.2, 55.3), 'Bombay': (19.1, 72.9), 'Delhi': (28.6, 77.2),
 'Hawái': (21.3, -157.9), 'Zelanda': (-41.3, 174.8), 'Groenlandia': (64.2, -51.7), 'Bagdad': (33.3, 44.4), 'Teherán': (35.7, 51.4), 'Kabul': (34.5, 69.2),
}

# Names that are several places at once, or half a name.
for _n in ("Santiago", "Guadalajara", "Rosario", "Zelanda"):
    LUGARES.pop(_n, None)
LAMBDA = 0.1


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


def main():
    src, pal, mapa, out = sys.argv[1:5]
    sys.stderr.reconfigure(encoding="utf-8")
    with open(pal, encoding="utf-8") as f:
        vocab = json.load(f)["palabras"]
    en_vocab = {w: i for i, w in enumerate(vocab)}
    quiero = set(vocab) | set(LUGARES) | {w for p in PARES for w in p}
    vec = {}
    for i, l in enumerate(lineas(src)):
        if i == 0:
            continue
        w, _, resto = l.partition(" ")
        if w not in quiero or w in vec:
            continue
        v = np.array(resto.split(), dtype=np.float32)
        if v.shape[0] == 300:
            vec[w] = v / np.linalg.norm(v)
    faltan = [w for w in quiero if w not in vec]
    print(f"{len(vec)} vectores; faltan {len(faltan)}: {faltan[:20]}", file=sys.stderr)

    # ---- The shared arrow.
    A = np.array([vec[a] for a, _ in PARES])
    B = np.array([vec[b] for _, b in PARES])
    d = (B - A).mean(0)
    d /= np.linalg.norm(d)
    M = (A + B) / 2
    M = M - M.mean(0)
    M = M - np.outer(M @ d, d)
    _, _, vt = np.linalg.svd(M, full_matrices=False)
    P = np.stack([d, vt[0], vt[1]])
    centro = P @ ((A + B) / 2).mean(0)
    pares = []
    for (a, b), va, vb in zip(PARES, A, B):
        pares.append({"a": a, "b": b, "ia": en_vocab[a], "ib": en_vocab[b], "pa": [round(float(x), 4) for x in P @ va - centro], "pb": [round(float(x), 4) for x in P @ vb - centro]})
        print(a, pares[-1]["pa"], b, pares[-1]["pb"], "cos", round(float((vb - va) @ d / np.linalg.norm(vb - va)), 2), file=sys.stderr)

    # ---- The map: ridge regression to a point on the unit sphere, each place left out in turn
    # (and with it any other name of the same spot, such as a country and its capital).
    nombres = [n for n in LUGARES if n in vec]
    ll = np.radians(np.array([LUGARES[n] for n in nombres]))
    Y = np.stack([np.cos(ll[:, 0]) * np.cos(ll[:, 1]), np.cos(ll[:, 0]) * np.sin(ll[:, 1]), np.sin(ll[:, 0])], 1)
    G = np.array([vec[n] for n in nombres])
    pred = []
    for i in range(len(nombres)):
        m = np.abs(Y - Y[i]).sum(1) > 1e-6
        Gm = G[m] - G[m].mean(0)
        a = np.linalg.solve(Gm @ Gm.T + LAMBDA * np.eye(m.sum()), Y[m] - Y[m].mean(0))
        p = (G[i] - G[m].mean(0)) @ Gm.T @ a + Y[m].mean(0)
        pred.append(p / np.linalg.norm(p))
    pred = np.array(pred)
    km = 6371 * np.arccos(np.clip((pred * Y).sum(1), -1, 1))
    print(f"{len(nombres)} lugares; error: mediana {np.median(km):.0f} km, media {km.mean():.0f} km, {100 * (km < 2000).mean():.0f} % a menos de 2000 km", file=sys.stderr)
    V = np.array([vec[w] for w in vocab])
    lugares = []
    for n, (la, lo), p, e in zip(nombres, (LUGARES[n] for n in nombres), pred, km):
        lugares.append({
            "n": n,
            "lat": la,
            "lon": lo,
            "plat": round(float(np.degrees(np.arcsin(p[2]))), 1),
            "plon": round(float(np.degrees(np.arctan2(p[1], p[0]))), 1),
            "km": int(e),
            "origen": int(np.argmax(V @ vec[n])),
        })
    print([(l["n"], vocab[l["origen"]]) for l in lugares[:12]], file=sys.stderr)

    # ---- The land.
    from PIL import Image

    img = np.asarray(Image.open(mapa).convert("RGB").resize((1440, 720)), dtype=np.float32)
    r, g, b = img[..., 0], img[..., 1], img[..., 2]
    es_tierra = ~((b > r * 1.25) & (b > g * 0.95)) | ((r > 150) & (g > 150) & (b > 150))
    rng = np.random.default_rng(3)
    tierra = []
    while len(tierra) < 2 * 26000:
        z = rng.uniform(-1, 1)
        lo = rng.uniform(-180, 180)
        la = np.degrees(np.arcsin(z))
        if es_tierra[min(719, int((90 - la) / 180 * 720)), min(1439, int((lo + 180) / 360 * 1440))]:
            tierra += [int(round(la * 100)), int(round(lo * 100))]

    with open(out, "w", encoding="utf-8") as f:
        json.dump(
            {
                "fuente": "fastText cc.es.300 (Grave et al. 2018), CC BY-SA 3.0",
                "error": {"mediana_km": int(np.median(km)), "dentro_2000km": round(float((km < 2000).mean()), 2)},
                "pares": pares,
                "lugares": lugares,
                "tierra": tierra,
            },
            f,
            ensure_ascii=False,
            separators=(",", ":"),
        )
    if len(sys.argv) > 5:
        Image.fromarray((es_tierra * 255).astype(np.uint8)).save(sys.argv[5])


main()
