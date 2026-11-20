"""The README, as in Espacio, Tiempo, Destino and Infinito: a cover (the title and the piece's question
over the hero clip) and six moments, one per act and in order, each a captured clip on one side and, on
the other, its count (the piece's rule: connections), title and line.

    PUERTO=5215 node tools/readme-clip.mjs              (the frames, from the journey itself)
    python tools/readme_media.py [cover tree ...]       ->  media/<name>-<theme>.avif / .webp

Drawn at 1840 px wide (about twice the README column, sharp on HiDPI screens), text included, from the
JPG frames in tools/readme/<clip>. AVIF at 30 fps for the page; a lighter WebP (920 px, 15 fps) for
browsers without AVIF. Each theme is flattened onto GitHub's own background. Clips loop forwards with a
crossfade, or play back and forth.
"""
import os, subprocess, sys, textwrap
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FR = os.path.join(ROOT, 'tools', 'readme')
OUT = os.path.join(ROOT, 'media')
NM = os.path.join(ROOT, 'node_modules')
SERIF = NM + '/@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2'
ITALIC = NM + '/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2'
MONO = NM + '/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2'

TITLE = 'Mente'
PHRASE = 'Who is watching?'

W, H = 960, 360            # layout units
CW, CH = 580, 326          # the clip
Z = 1840 / W               # px per unit
PW, PH = round(W * Z), round(H * Z)
FPS = 30
WEBP_W, WEBP_Q = 920, 70
XFADE = 18                 # frames of crossfade when looping forwards
BAND = 330                 # the cover's title band, px

THEMES = {
    'dark': dict(page=(13, 17, 23), ink=(236, 231, 219), dim=(236, 231, 219, 150), acc=(255, 209, 128)),
    'light': dict(page=(255, 255, 255), ink=(31, 29, 26), dim=(31, 29, 26, 160), acc=(150, 104, 24)),
}

# name, frames dir, crop (x, y, w, h) in the frames, the count (floors of a power, and the unit: what the
# journey's own count shows there), title, line, loop. One per act, in order (the cover is act III).
MOMENTS = [
    ('worm', 'worm', (0, 0, 1840, 1035), (['7 000'], 'connections'), 'Three hundred and two',
     'With 302 neurons, this worm looks for food, runs away and learns.', 'forward'),
    ('eye', 'eye', (0, 0, 1840, 1035), (['21 793'], 'connections'), 'Nobody told it how',
     'It draws an eye. Nobody explained what an eye is. It was only told, millions of times, how wrong it was.', 'forward'),
    ('branches', 'branches', (0, 0, 1840, 1035), (['10', '12'], 'connections'), 'Each one its own way',
     'Thinking was invented once. Everything that thinks on Earth comes from here.', 'forward'),
    ('still', 'still', (0, 0, 1840, 1035), (['10', '14'], 'connections'), 'The rain stops',
     'For a mind like that, the rain hangs in the air. One day of yours, three thousand years of its own.', 'forward'),
    ('swap', 'swap', (0, 0, 1840, 1035), (['10', '14'], 'connections'), 'One by one',
     'One by one, your neurons are swapped for ones that do the same. Are you still there?', 'forward'),
    ('descendants', 'descendants', (0, 0, 1840, 1035), (['?'], ''), 'Descendants',
     'Whatever comes to fill this galaxy may not have your body. But it will carry your words.', 'forward'),
]
# The hero: the thread of light writing, star by star, the sentence a machine wrote for whoever reads it.
# (a squarer feather than the others: the sentence runs across the top of the frame and must stay whole)
HERO = dict(clips=['hero'], crop=(0, 0, 1840, 1150), crf=40, join=16, webp_q=50, feather=(6, 0.86))
CRF = {}


def px(v):
    return round(v * Z)


def feather(w, h, p=3, inner=0.6):
    """A soft superellipse: 1 in the middle, 0 at the edges, no corners."""
    u = np.abs(np.linspace(-1, 1, w))[None, :]
    v = np.abs(np.linspace(-1, 1, h))[:, None]
    d = (u ** p + v ** p) ** (1 / p)
    t = np.clip((d - inner) / (1 - inner), 0, 1)
    return 1 - t * t * (3 - 2 * t)


def card(w, h, r=22):
    """Light theme: a crisp rounded card (anti-aliased by supersampling)."""
    im = Image.new('L', (w * 4, h * 4), 0)
    ImageDraw.Draw(im).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), px(r) * 4, fill=255)
    return np.asarray(im.resize((w, h), Image.LANCZOS), dtype=np.float32) / 255


def text_layer(count, title, line, tx, th):
    floors, unit = count
    f_t = ImageFont.truetype(SERIF, px(50))
    f_l = ImageFont.truetype(ITALIC, px(27))
    f_m = ImageFont.truetype(MONO, px(22))
    tl = textwrap.wrap(title, 15)
    ll = textwrap.wrap(line, 30)
    block = 44 + 52 * len(tl) + 14 + 32 * len(ll)
    im = Image.new('RGBA', (PW, PH), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    y = (H - block) // 2
    # how many: a power, the exponent smaller and raised over the base (as in Infinito)
    x, yy, size = px(tx), px(y), 22.0
    for fl in floors:
        f = ImageFont.truetype(MONO, px(size))
        d.text((x, yy), fl, font=f, fill=th['acc'])
        x += d.textlength(fl, font=f) + px(1)
        yy -= px(size * 0.42)
        size *= 0.64
    if unit:
        d.text((x + px(8), px(y)), unit, font=f_m, fill=th['acc'])
    y += 44
    for ln in tl:
        d.text((px(tx), px(y)), ln, font=f_t, fill=th['ink'])
        y += 52
    y += 14
    for ln in ll:
        d.text((px(tx), px(y)), ln, font=f_l, fill=th['dim'])
        y += 32
    return np.asarray(im, dtype=np.float32) / 255


def encode_avif(dst, w, h, crf=34):
    return subprocess.Popen(
        ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{w}x{h}', '-r', str(FPS), '-i', '-',
         '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
         '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-colorspace', 'bt709', '-color_range', 'tv',
         '-c:v', 'libsvtav1', '-preset', '5', '-crf', str(crf), '-g', '600', '-loop', '0', dst],
        stdin=subprocess.PIPE)


def count(clip):
    return len([f for f in os.listdir(os.path.join(FR, clip)) if f.endswith('.jpg')])


def sequence(n, mode):
    """Frame indices, or (a, b, w) blends for the crossfade of a forward loop."""
    idx = list(range(n))
    if mode == 'pingpong':
        return [(i, None, 0) for i in idx + idx[-2:0:-1]]
    # forwards: the last frames fade into the first ones, so the loop has no seam
    body = idx[:-XFADE]
    tail = [(idx[-XFADE + k], idx[k], (k + 1) / (XFADE + 1)) for k in range(XFADE)]
    return [(i, None, 0) for i in body[XFADE:]] + tail


def loader(clip, crop, size):
    x, y, w, h = crop
    cache = {}
    def frame(i):
        if i not in cache:
            im = Image.open(os.path.join(FR, clip, f'{i:04d}.jpg')).convert('RGB')
            im = im.crop((x, y, x + w, y + h))
            if im.size != size:
                im = im.resize(size, Image.LANCZOS)
            cache[i] = np.asarray(im, dtype=np.float32) / 255
            if len(cache) > 48:
                cache.pop(next(iter(cache)))
        return cache[i]
    return frame


def write(dst, frames, w, h, crf=34, webp_q=WEBP_Q):
    enc = encode_avif(dst + '.avif', w, h, crf)
    webp = []
    for n, out in enumerate(frames):
        img = Image.fromarray((np.clip(out, 0, 1) * 255 + .5).astype(np.uint8), 'RGB')
        enc.stdin.write(img.tobytes())
        if n % 2 == 0:
            webp.append(img.resize((WEBP_W, round(h * WEBP_W / w)), Image.LANCZOS))
    enc.stdin.close()
    enc.wait()
    webp[0].save(dst + '.webp', save_all=True, append_images=webp[1:], duration=2000 // FPS, loop=0, quality=webp_q, method=4)
    print(f'  {os.path.basename(dst)}: {len(webp) * 2} frames  {w}x{h}  avif {os.path.getsize(dst + ".avif") / 1e6:.2f} MB'
          f'  webp {os.path.getsize(dst + ".webp") / 1e6:.2f} MB', flush=True)


def moment(k, m):
    name, clip, crop, cnt, title, line, mode = m
    left = k % 2 == 0
    cw, ch = px(CW), px(CH)
    cx = 0 if left else PW - cw
    cy = (PH - ch) // 2
    tx = CW + 10 if left else 30
    frame = loader(clip, crop, (cw, ch))
    seq = sequence(count(clip), mode)
    mask, rounded = feather(cw, ch), card(cw, ch)
    for theme, th in THEMES.items():
        page = np.array(th['page'], np.float32) / 255
        txt = text_layer(cnt, title, line, tx, th)
        ta = txt[..., 3:4]
        def frames():
            for a, bb, wgt in seq:
                rgb = frame(a) if bb is None else frame(a) * (1 - wgt) + frame(bb) * wgt
                # dark: screened over the page (black becomes the page), feathered; light: a rounded card
                col, al = (page + rgb * (1 - page), mask) if theme == 'dark' else (rgb, rounded)
                out = np.empty((PH, PW, 3), np.float32)
                out[:] = page
                out[cy:cy + ch, cx:cx + cw] = col * al[..., None] + page * (1 - al[..., None])
                yield txt[..., :3] * ta + out * (1 - ta)
        write(os.path.join(OUT, f'{name}-{theme}'), frames(), PW, PH, CRF.get(name, 34))


def band(th):
    """The title and the question, drawn straight at full size (never scaled)."""
    im = Image.new('RGBA', (PW, BAND), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((PW // 2, 205), TITLE, font=ImageFont.truetype(SERIF, 196), fill=th['ink'], anchor='ms')
    d.text((PW // 2, 285), PHRASE, font=ImageFont.truetype(ITALIC, 46), fill=th['ink'] + (180,), anchor='ms')
    return np.asarray(im, dtype=np.float32) / 255


def hero_sequence(HERO=HERO):
    """(clip, frame) pairs and blends: each clip whole, the next fading in over its last `join` frames,
    and the last fading into the first, so the loop has no seam."""
    j = HERO['join']
    clips = [(c, count(c)) for c in HERO['clips']]
    seq = []
    for k, (c, n) in enumerate(clips):
        nc, nn = clips[(k + 1) % len(clips)]
        for i in range(j, n - j):           # its first j frames live in the previous blend
            seq.append(((c, i), None, 0))
        for i in range(j):
            seq.append(((c, n - j + i), (nc, i), (i + 1) / (j + 1)))
    return seq


def cover(HERO=HERO, nombre='cover'):
    """The title over the hero, blended into the page and looping forwards."""
    x, y, w, h = HERO['crop']
    vh = round(PW * h / w)
    loaders = {c: loader(c, HERO['crop'], (PW, vh)) for c in HERO['clips']}
    frame = lambda ci: loaders[ci[0]](ci[1])
    seq = hero_sequence(HERO)
    fp, fi = HERO.get('feather', (3, 0.72))
    mask, rounded = feather(PW, vh, p=fp, inner=fi), card(PW, vh, r=21)
    for theme, th in THEMES.items():
        page = np.array(th['page'], np.float32) / 255
        txt = band(th)
        ta = txt[..., 3:4]
        top = txt[..., :3] * ta + page * (1 - ta)
        def frames():
            out = np.empty((BAND + vh, PW, 3), np.float32)
            out[:BAND] = top
            for a, bb, wgt in seq:
                rgb = frame(a) if bb is None else frame(a) * (1 - wgt) + frame(bb) * wgt
                col, al = (page + rgb * (1 - page), mask) if theme == 'dark' else (rgb, rounded)
                out[BAND:] = col * al[..., None] + page * (1 - al[..., None])
                yield out
        write(os.path.join(OUT, f'{nombre}-{theme}'), frames(), PW, BAND + vh, HERO['crf'], HERO['webp_q'])


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    which = sys.argv[1:]
    if not which or 'cover' in which:
        cover()
    for k, m in enumerate(MOMENTS):
        if not which or m[0] in which:
            moment(k, m)
