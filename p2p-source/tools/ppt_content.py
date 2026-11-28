#!/usr/bin/env python3
"""Resolve p2p-source (data, guide, screens) into ppt/content.json for tools/build_ppt.js"""
import yaml, json, re, pathlib
root = pathlib.Path('/workspace/oracle-review'); src = root/'p2p-source'
d = yaml.safe_load((src/'data.yaml').read_text())['datasets']['abc']
g = yaml.safe_load((src/'guide.yaml').read_text())
scr = {s['id']: s for s in json.load(open(root/'lab/src/data/ebs/screens.json'))}
def F(s):
    if isinstance(s, str): return re.sub(r'\{\{(\w+)\}\}', lambda m: d[m.group(1)], s)
    if isinstance(s, list): return [F(x) for x in s]
    if isinstance(s, dict): return {k: F(v) for k, v in s.items()}
    return s
out = {'d': d, 'title': F(g['title']), 'flow': F(g['flow']), 'notes': F(g['flowNotes']), 'acct': F(g['accounting']), 'srcHash': json.load(open(root/'lab/src/data/ebs/source-hash.json'))['sourceHash'], 'steps': []}
for s in g['steps']:
    st = {k: F(v) for k, v in s.items() if k != 'screens'}
    st['screens'] = []
    for i in s['screens']:
        x = scr[i]
        ebs = [x['responsibility']] + [p.strip() for p in (x.get('nav') or '').split('>') if p.strip()]
        st['screens'].append({'id': i, 'title': F(x['title']), 'page': x['page'], 'w': x['w'], 'h': x['h'], 'ebs': F(ebs), 'fus': F(x['fusion'].get('path', []))})
    out['steps'].append(st)
(root/'ppt'/'content.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
print('steps', len(out['steps']), 'screens', sum(len(s['screens']) for s in out['steps']))
