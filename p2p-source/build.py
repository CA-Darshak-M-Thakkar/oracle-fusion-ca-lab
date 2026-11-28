#!/usr/bin/env python3
"""Generate the lab's EBS replica data from the single source of truth (p2p-source/*.yaml).
Usage: python3 build.py [path-to-lab-repo]
Default: the parent folder when this file sits in <repo>/p2p-source, else /workspace/oracle-review/lab."""
import sys, json, copy, hashlib, pathlib, yaml
here = pathlib.Path(__file__).parent
_here = pathlib.Path(__file__).resolve().parent
_default = _here.parent if (_here.parent / 'src' / 'data').exists() else pathlib.Path('/workspace/oracle-review/lab')
repo = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else _default)
out = repo / 'src' / 'data' / 'ebs'
out.mkdir(parents=True, exist_ok=True)
y = lambda n: yaml.safe_load((here / n).read_text(encoding='utf-8'))
theme, data, p2p, fus = y('theme.yaml'), y('data.yaml'), y('p2p.yaml'), y('fusion.yaml')
built = {}
res = []
def rescale(els, k):
    def n(v): return round(v * k) if isinstance(v, (int, float)) and not isinstance(v, bool) else v
    out = []
    for e in els:
        e = json.loads(json.dumps(e)); t0 = e[0]
        idx = {'t': [1,2], 'f': [1,2,3,4], 'b': [1,2,3,4], 'panel': [1,2,3,4], 'grp': [1,2,3,4], 'rect': [1,2,3,4], 'vscroll': [1,2,3], 'hscroll': [1,2,3], 'radio': [1,2], 'chk': [1,2], 'ico': [1,2], 'pre': [1,2,3]}.get(t0, [])
        for i in idx: e[i] = n(e[i])
        if t0 == 'rect' and len(e) > 7: e[7] = n(e[7])
        if t0 == 'tabs':
            e[1] = n(e[1]); e[2] = n(e[2]); e[3] = [[x[0], n(x[1]), n(x[2])] for x in e[3]]
        if t0 == 'grid':
            e[1] = n(e[1]); e[2] = n(e[2]); e[4] = [[c[0], n(c[1]), n(c[2])] + c[3:] for c in e[4]]
            o = e[6] or {}
            for key in ('mark', 'chk', 'lastCol', 'clipX', 'hy', 'hh'):
                if key in o: o[key] = n(o[key])
            e[6] = o
        out.append(e)
    return out
def make(s):
    s = copy.deepcopy(s)
    if 'base' in s:
        b = copy.deepcopy(built[s['base']])
        b.pop('scale', None)  # base els are already in ref pixels
        els = b['els']
        for old, new in s.get('sub', []):
            els = json.loads(json.dumps(els).replace(json.dumps(old)[1:-1], json.dumps(new)[1:-1]))
        add = s.get('add', [])
        if s.get('addScale'): add = rescale(add, s['addScale'])
        els = [e for e in els if e[0] not in s.get('drop', [])]
        els += add
        b.update({k: v for k, v in s.items() if k not in ('base', 'sub', 'add', 'drop', 'addScale')})
        b['els'] = els
        s = b
    if s.get('scale'): s['els'] = rescale(s['els'], s['scale'])
    s['fusion'] = fus['screens'][s['id']]
    built[s['id']] = s
pending = list(p2p['screens'])
while pending:
    todo = [s for s in pending if 'base' not in s or s['base'] in built]
    assert todo, 'circular base'
    for s in todo: make(s)
    pending = [s for s in pending if s['id'] not in built]
res = [built[s['id']] for s in p2p['screens']]
res.sort(key=lambda s: s['step'])  # stable: keeps file order inside a step
(out / 'screens.json').write_text(json.dumps(res, ensure_ascii=False), encoding='utf-8')
(out / 'fusion-meta.json').write_text(json.dumps({k: fus[k] for k in ('navigator', 'tasks', 'users')}, ensure_ascii=False), encoding='utf-8')
(out / 'data.json').write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
(out / 'theme.json').write_text(json.dumps(theme, ensure_ascii=False), encoding='utf-8')
h = hashlib.sha256(b''.join((here / n).read_bytes() for n in ('theme.yaml', 'data.yaml', 'p2p.yaml', 'fusion.yaml'))).hexdigest()[:12]
(out / 'source-hash.json').write_text(json.dumps({'sourceHash': h, 'screens': len(res)}))
print(f'built {len(res)} screens, source hash {h}')
