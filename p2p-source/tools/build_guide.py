#!/usr/bin/env python3
"""Build the dark tutor quick guide (HTML) from p2p-source/{data,guide}.yaml and the screens in the lab repo. PDF: node tools/guide_pdf.mjs"""
import yaml, json, re, html, pathlib
root = pathlib.Path('/workspace/oracle-review')
src = root / 'p2p-source'
data = yaml.safe_load((src / 'data.yaml').read_text())['datasets']['abc']
g = yaml.safe_load((src / 'guide.yaml').read_text())
screens = {s['id']: s for s in json.load(open(root / 'lab/src/data/ebs/screens.json'))}
src_hash = json.load(open(root / 'lab/src/data/ebs/source-hash.json'))['sourceHash']
def F(s): return re.sub(r'\{\{(\w+)\}\}', lambda m: data[m.group(1)], s) if isinstance(s, str) else s
E_ = lambda s: html.escape(F(s))
def arrows(items, cls):
    return ' <span class="ar %s">→</span> '.join(f'<span class="st">{E_(i)}</span>' for i in items)
def pages_of(ids):
    p = sorted({screens[i]['page'] for i in ids})
    return ', '.join(map(str, p))
css = '''
@page { size: 420mm 297mm; margin: 0 }
* { box-sizing: border-box; }
html, body { margin: 0; background: #000; color: #f4f4f4; font-family: Inter, "Noto Sans", sans-serif; font-weight: 400; }
.page { width: 420mm; height: 297mm; padding: 26px 44px 22px; page-break-after: always; position: relative; overflow: hidden; background: #000; font-size: 24pt; line-height: 1.28; }
.page:last-child { page-break-after: auto; }
h1 { font-size: 40pt; font-weight: 600; margin: 0 0 6px; color: #fff; line-height: 1.1; }
h2 { font-size: 26pt; font-weight: 600; margin: 0 0 8px; color: #fff; }
h3 { font-size: 20pt; font-weight: 600; margin: 0 0 6px; letter-spacing: .5px; text-transform: uppercase; }
p { margin: 0 0 8px; }
.kick { font-size: 20pt; color: #ffd24d; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
.sub { color: #cfcfcf; margin-bottom: 14px; }
.meta { color: #cfcfcf; margin-bottom: 10px; }
.meta b, .num b { font-weight: 600; color: #fff; }
.purpose { margin-bottom: 14px; }
.row { display: flex; gap: 22px; margin-bottom: 16px; }
.row > * { flex: 1 1 0; min-width: 0; }
.box { border: 2px solid #5a5a5a; border-radius: 14px; padding: 12px 18px 10px; }
.ebs { border-color: #5fb4ff; } .ebs h3 { color: #5fb4ff; } .ar.ebs { color: #5fb4ff; }
.fus { border-color: #ff7d66; } .fus h3 { color: #ff7d66; } .ar.fus { color: #ff7d66; }
.ar { font-size: 26pt; line-height: 1; vertical-align: -2px; }
.st { color: #fff; }
.num { border-color: #ffd24d; } .num h3 { color: #ffd24d; }
.stat { border-color: #6fe28a; } .stat h3 { color: #6fe28a; }
.big { font-size: 32pt; color: #ffd24d; font-weight: 600; }
table { border-collapse: collapse; width: 100%; }
td { padding: 2px 8px 2px 0; vertical-align: top; border-bottom: 1px solid #333; }
td:first-child { color: #bdbdbd; width: 42%; }
td:last-child { color: #fff; }
.cols { display: flex; gap: 26px; }
.colL { flex: 0 0 41%; } .colR { flex: 1; display: flex; flex-direction: column; gap: 12px; }
.foot { position: absolute; left: 44px; right: 44px; bottom: 14px; color: #a8a8a8; font-size: 16pt; display: flex; justify-content: space-between; }
.chain .pill { display: inline-block; border: 2px solid #6fe28a; border-radius: 30px; padding: 0 16px; margin: 2px 4px 2px 0; color: #fff; }
.flow { display: flex; flex-wrap: wrap; gap: 18px 56px; margin: 8px 0 14px; }
.node { width: calc(25% - 42px); border: 2px solid #ffd24d; border-radius: 16px; padding: 12px 16px; position: relative; min-height: 300px; }
.node .n { position: absolute; top: -18px; left: 14px; background: #ffd24d; color: #000; border-radius: 22px; padding: 0 16px; font-size: 20pt; font-weight: 600; }
.node .nm { font-size: 27pt; color: #fff; font-weight: 600; margin: 6px 0 6px; line-height: 1.1; }
.node .who { color: #5fb4ff; } .node .mod { color: #cfcfcf; } .node .doc { color: #ffd24d; margin-top: 8px; }
.node .arrow { position: absolute; right: -48px; top: 50%; color: #ffd24d; font-size: 34pt; }
.node.lastrow .arrow.cut { display: none; }
ul { margin: 0; padding-left: 28px; } li { margin-bottom: 8px; }
.ent td:first-child { color: #ffd24d; width: 24%; } .ent td { padding: 8px 10px 8px 0; }
'''
out = [f'<!doctype html><html><head><meta charset="utf-8"><style>{css}</style></head><body>']
# cover + flow
out.append(f'''<section class="page"><div class="kick">Tutor quick guide · Part 1: the whole module</div>
<h1>{E_(g['title'])}</h1><div class="sub">{E_(g['subtitle'])}</div>
<div class="flow">''')
for i, n in enumerate(g['flow']):
    last_in_row = i in (3, 7)
    out.append(f'''<div class="node"><span class="n">Step {n['n']}</span><div class="nm">{E_(n['name'])}</div>
<div class="who">{E_(n['who'])}<br><span class="mod">{E_(n['role'])}</span></div><div class="mod">Module: {E_(n['module'])}</div>
<div class="doc">{E_(n['doc'])}</div>{'' if last_in_row else '<span class="arrow">→</span>'}</div>''')
out.append(f'''</div><div class="meta">Step numbers match Part 2 and the manual. Steps 4 and 6 sit inside the PO and Receipt boxes.</div>
<div class="foot"><span>EBS R12 (older system) · Oracle Fusion Cloud (current system)</span><span>Page 1</span></div></section>''')
# dataset page
d = data
people = [('Requester', d['requester']), ('Buyer', d['buyer']), ('Approver', d['approver']), ('Warehouse Receiver', d['receiver']), ('AP Accountant', d['apclerk']), ('Cashier', d['cashier'])]
rowsL = [('Company', d['company']), ('Company address', d['companyAddr']), ('Company GSTIN', d['gstin']), ('Business unit', d['ou']), ('Receiving org', f"{d['orgname']} ({d['org']})"), ('Supplier', d['supplier']), ('Supplier address', d['supplierAddr']), ('Supplier GSTIN', d['supgstin']), ('Item', f"{d['itemdesc']}, {d['category']}"), ('Quantity x price', f"{d['qty']} {d['uom']} x ₹{d['price']}"), ('Amount', f"₹{d['amount']}"), ('IGST 18%', f"₹{d['igst']}"), ('Invoice total', f"₹{d['total']}")]
rowsR = [(r, n) for r, n in people] + [('Requisition', d['req']), ('Purchase order', d['po']), ('Receipt', d['rcpt']), ('Invoice', d['invno']), ('Payment', d['payno']), ('Requisition date', d['f_req']), ('PO date', d['f_po']), ('Receipt date', d['f_rcpt']), ('Invoice date', d['f_inv']), ('Due and pay date', d['f_due'])]
tab = lambda rows: '<table>' + ''.join(f'<tr><td>{html.escape(a)}</td><td>{html.escape(b)}</td></tr>' for a, b in rows) + '</table>'
out.append(f'''<section class="page"><div class="kick">Part 1</div><h1>One example, used on every screen</h1>
<div class="sub">Use exactly these values in class, in the EBS screens, in the Fusion screens and in the lab. Note: the GSTINs and addresses are dummy teaching data, not real registrations.</div>
<div class="row"><div class="box num"><h3>Company, supplier, item</h3>{tab(rowsL)}</div><div class="box num"><h3>People, numbers, dates</h3>{tab(rowsR)}</div></div>
<div class="foot"><span>Source: p2p-source/data.yaml ({src_hash})</span><span>Page 2</span></div></section>''')
# rules + accounting
notes = ''.join(f'<li>{E_(x)}</li>' for x in g['flowNotes'])
ent = ''.join(f'<tr><td>{E_(a)}</td><td>{E_(b)}</td><td>{E_(c)}</td></tr>' for a, b, c in g['accounting'])
out.append(f'''<section class="page"><div class="kick">Part 1</div><h1>Three rules and three entries</h1>
<div class="row"><div class="box ebs" style="border-color:#ffd24d"><h3 style="color:#ffd24d">Remember</h3><ul>{notes}</ul></div></div>
<div class="row"><div class="box stat"><h3>What the books show (all in ₹)</h3><table class="ent">{ent}</table></div></div>
<div class="meta">Net effect of the whole cycle: Dr Inventory ₹{d['amountsh']}, Dr Input IGST ₹{d["igst"]}, Cr Bank ₹{d['totalsh']}.</div>
<div class="foot"><span>Part 2 follows: one page per step, 1 to 10</span><span>Page 3</span></div></section>''')
# steps
pg = 3
for s in g['steps']:
    pg += 1
    rows = ''.join(f'<tr><td>{html.escape(F(a))}</td><td>{html.escape(F(b))}</td></tr>' for a, b in s['fields'])
    chain = ' <span class="ar" style="color:#6fe28a">→</span> '.join(f'<span class="pill">{E_(x)}</span>' for x in s['status'])
    scr = ', '.join(s['screens'])
    out.append(f'''<section class="page"><div class="cols">
<div class="colL"><div class="kick">Part 2 · Step {s['n']} of 10</div><h1>{E_(s['title'])}</h1>
<div class="meta">Who: <b>{E_(s['who'])}</b><br>Module: <b>{E_(s['module'])}</b><br>Date: <b>{E_(s['date'])}</b></div>
<div class="purpose">{E_(s['purpose'])}</div>
<div class="box ebs" style="margin-bottom:14px"><h3>EBS R12 (older system): click path</h3>{arrows(s['ebs'], 'ebs')}</div>
<div class="box fus"><h3>Oracle Fusion Cloud (current system): click path</h3>{arrows(s['fusion'], 'fus')}{('<div class="meta" style="margin-top:6px;font-size:18pt">' + E_(s['lab']) + '</div>') if s.get('lab') else ''}</div></div>
<div class="colR"><div class="box num"><h3>Values on the screen</h3><table>{rows}</table></div>
<div class="box"><h3 style="color:#fff">Button to press</h3>{''.join(f'<div>{E_(b)}</div>' for b in s['button'])}</div>
<div class="box stat chain"><h3>Status before and after</h3><div>{chain}</div></div>
<div class="box num"><h3>Number generated · where it is used next</h3><div class="big">{E_(s['number'][0])}</div><div>{E_(s['number'][1])}</div></div></div></div>
<div class="foot"><span>Manual pages: {pages_of(s['screens'])} · {len(s['screens'])} screens in the lab gallery (#ebs-replica)</span><span>Page {pg}</span></div></section>''')
out.append('</body></html>')
(root / 'guide').mkdir(exist_ok=True)
(root / 'guide/P2P-tutor-quick-guide.html').write_text('\n'.join(out), encoding='utf-8')
print('guide html', pg, 'pages')
