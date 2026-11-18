"""The worm: every neuron of C. elegans with its real shape and its real connections.

  python -I tools/gusano.py <c302/NeuroML2 folder> <herm_full_edgelist.csv>

Shapes: the NeuroML2 cells of OpenWorm's c302 (MIT), traced from the Virtual Worm (Grove, WormBase).
Connections: the hermaphrodite's chemical synapses of Cook et al. 2019 (the edge list c302 ships).
Writes src/datos/gusano.json: per neuron its name, its kind (s sensory, i inter, m motor) and its
segments as [x, y, z, distance from the body along the process, parent] in micrometres; and the
edges as [from, to, synapses].
"""
import csv
import json
import math
import os
import sys
import xml.etree.ElementTree as ET

NS = '{http://www.neuroml.org/schema/neuroml2}'
carpeta, aristas = sys.argv[1], sys.argv[2]

neuronas = []
for f in sorted(os.listdir(carpeta)):
    if not f.endswith('.cell.nml'):
        continue
    cell = ET.parse(os.path.join(carpeta, f)).getroot().find(NS + 'cell')
    notas = (cell.findtext(NS + 'notes') or '').lower()
    if 'muscle' in notas:
        continue  # the one muscle that ships with the cells
    tipo = 's' if 'sensory' in notas else 'm' if 'motor' in notas else 'i'
    seg = {}
    orden = []
    for s in cell.find(NS + 'morphology').findall(NS + 'segment'):
        i = int(s.get('id'))
        d = s.find(NS + 'distal')
        par = s.find(NS + 'parent')
        seg[i] = ([float(d.get(k)) for k in 'xyz'], int(par.get('segment')) if par is not None else -1)
        orden.append(i)
    idx = {i: k for k, i in enumerate(orden)}
    dist = {}
    puntos = []
    for i in orden:
        p, par = seg[i]
        dist[i] = 0.0 if par < 0 else dist[par] + math.dist(p, seg[par][0])
        puntos.append([round(p[0], 1), round(p[1], 1), round(p[2], 1), round(dist[i], 1), idx.get(par, -1)])
    neuronas.append({'n': cell.get('id'), 't': tipo, 'p': [v for q in puntos for v in q]})

nombre = {n['n']: k for k, n in enumerate(neuronas)}
pares = {}
with open(aristas, newline='') as fh:
    for row in csv.DictReader(fh):
        a, b = row['Source'].strip(), row['Target'].strip()
        if row['Type'].strip() != 'chemical' or a not in nombre or b not in nombre:
            continue
        k = (nombre[a], nombre[b])
        pares[k] = pares.get(k, 0) + int(float(row['Weight']))
edges = [[a, b, w] for (a, b), w in sorted(pares.items())]

out = os.path.join(os.path.dirname(__file__), '..', 'src', 'datos', 'gusano.json')
with open(out, 'w', encoding='utf-8') as fh:
    json.dump({'neuronas': neuronas, 'sinapsis': edges}, fh, separators=(',', ':'))
ps = [n['p'] for n in neuronas]
for k, eje in enumerate('xyz'):
    v = [x for p in ps for x in p[k::5]]
    print(eje, min(v), max(v))
print(len(neuronas), 'neurons', {t: sum(n['t'] == t for n in neuronas) for t in 'sim'}, sum(len(p) // 5 for p in ps), 'segments')
print(len(edges), 'pairs', sum(e[2] for e in edges), 'chemical synapses', os.path.getsize(out), 'bytes')
