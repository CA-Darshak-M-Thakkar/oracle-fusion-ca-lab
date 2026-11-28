// Build the P2P classroom PPT from ppt/content.json (generated from p2p-source) and ppt/img/*.png. Theme: opt01 Pure Black + Cyan. Min text 24pt, body not bold, no slide counters.
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const ROOT = '/workspace/oracle-review/ppt';
const c = JSON.parse(fs.readFileSync(ROOT + '/content.json', 'utf8'));
const d = c.d;
const FONT = 'Segoe UI';
const K = { bg: '000000', card: '0B0B0B', line: '3A3A3A', accent: '00D4FF', title: 'FFFFFF', body: 'E6E6E6', mute: 'A8A8A8', ebs: '5FB4FF', fus: 'FF7D66', yel: 'FFD24D', grn: '6FE28A' };
const W = 13.333, H = 7.5, MX = 0.45, CW = W - 2 * MX;
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE'; pres.author = 'AITT'; pres.title = 'Procure to Pay: EBS R12 and Oracle Fusion Cloud'; pres.company = '';
const sh = (o) => Object.assign({}, o);

function base(notes) {
  const s = pres.addSlide();
  s.background = { color: K.bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.12, h: H, fill: { color: K.accent }, line: { color: K.accent, width: 0 } });
  if (notes) s.addNotes(notes);
  return s;
}
function tx(s, text, o) {
  s.addText(text, Object.assign({ fontFace: FONT, fontSize: 24, color: K.body, bold: false, margin: 0, valign: 'top', fit: 'none' }, o));
}
const title = (s, t, o) => tx(s, t, Object.assign({ x: MX, y: 0.28, w: CW, h: 0.65, fontSize: 36, bold: true, color: K.title, valign: 'middle' }, o || {}));
const kicker = (s, t, color) => tx(s, t, { x: MX, y: 0.28, w: CW, h: 0.4, fontSize: 24, color: color || K.accent });

const estW = (t) => Math.max(0.9, t.length * 0.168 + 0.5);
function chips(s, items, x0, y0, w, color) {
  let x = x0, y = y0; const ph = 0.56, pitch = 0.68;
  items.forEach((t, i) => {
    let cw = Math.min(estW(t), w), lines = Math.ceil(estW(t) / w);
    const aw = i < items.length - 1 ? 0.5 : 0;
    if (x > x0 && x + cw + aw > x0 + w) { x = x0; y += pitch; }
    const h = ph + (lines - 1) * 0.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h, rectRadius: 0.1, fill: { color: K.card }, line: { color, width: 1.5 } });
    tx(s, t, { x, y, w: cw, h, align: 'center', valign: 'middle', color: K.title });
    x += cw;
    if (aw) { tx(s, '\u2192', { x, y, w: aw, h: ph, align: 'center', valign: 'middle', color, fontSize: 28 }); x += aw; }
  });
  return y + ph;
}
function chipsV(s, items, x0, y0, w, color) {
  let y = y0; const ph = 0.56;
  items.forEach((t, i) => {
    const lines = Math.ceil(estW(t) / w), h = ph + (lines - 1) * 0.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x0, y, w, h, rectRadius: 0.1, fill: { color: K.card }, line: { color, width: 1.5 } });
    tx(s, t, { x: x0, y, w, h, align: 'center', valign: 'middle', color: K.title });
    y += h;
    if (i < items.length - 1) { tx(s, '\u2193', { x: x0, y, w, h: 0.4, align: 'center', valign: 'middle', color, fontSize: 26 }); y += 0.4; }
  });
  return y;
}
const sub2 = (s, t) => tx(s, t, { x: MX, y: 0.95, w: CW, h: 0.45, color: K.mute });
function arrowText(items, color) {
  const r = [];
  items.forEach((t, i) => { r.push({ text: t, options: { color: K.title } }); if (i < items.length - 1) r.push({ text: '  \u2192  ', options: { color } }); });
  return r;
}
function fitImg(pw, ph, bw, bh) { const k = Math.min(bw / pw, bh / ph); return { w: pw * k, h: ph * k }; }
function pic(s, file, x, y, bw, bh, color) {
  const sz = require('child_process').execSync(`python3 -c "from PIL import Image;im=Image.open('${file}');print(im.size[0],im.size[1])"`).toString().trim().split(' ').map(Number);
  const f = fitImg(sz[0], sz[1], bw, bh);
  const px = x + (bw - f.w) / 2;
  s.addShape(pres.shapes.RECTANGLE, { x: px - 0.04, y: y - 0.04, w: f.w + 0.08, h: f.h + 0.08, fill: { color: K.bg }, line: { color, width: 1.5 } });
  s.addImage({ path: file, x: px, y, w: f.w, h: f.h });
  return { x: px, y, w: f.w, h: f.h };
}
const LBL = { ebs: 'EBS R12 (older system)', fus: 'Fusion Cloud (current system)' };
function label(s, which, x, y, w) { tx(s, LBL[which], { x, y, w, h: 0.45, color: K[which], valign: 'middle' }); }

// ---------- opening slides ----------
{ // cover
  const s = base('P2P tutor deck. One dataset (p2p-source/data.yaml) feeds the lab, the guide PDF and this deck. GSTINs and addresses are dummy teaching data.');
  tx(s, 'Oracle Fusion ERP', { x: 0.9, y: 1.2, w: 11.5, h: 0.5, color: K.accent });
  tx(s, 'Procure to Pay', { x: 0.9, y: 1.8, w: 11.5, h: 1.2, fontSize: 60, bold: true, color: K.title, valign: 'middle' });
  tx(s, 'EBS R12 (older system) next to Fusion Cloud (current system)', { x: 0.9, y: 3.2, w: 11.5, h: 0.9, color: K.body });
  tx(s, `One example: ${d.companyShort} buys ${d.qty} ${d.itemdesc}s from ${d.supplier}`, { x: 0.9, y: 4.3, w: 11.5, h: 0.9, color: K.body });
  chips(s, ['EBS R12 (older system)'], 0.9, 5.7, 4.6, K.ebs);
  chips(s, ['Fusion Cloud (current system)'], 5.9, 5.7, 5.2, K.fus);
}
{ // flow
  const s = base('General flow. Steps 3-4 are both about the purchase order (create, then approve); steps 5-6 are receive and inspect.');
  title(s, 'The general flow: Requisition to Close');
  const bw = 2.78, bh = 2.7, gap = 0.4, y1 = 1.15, y2 = 4.15;
  const n = c.flow.length;
  const rng = c.flow.map((f, i) => { const a = f.n, b = i < n - 1 ? c.flow[i + 1].n - 1 : f.n; return a === b ? `Step ${a}` : `Steps ${a}-${b}`; });
  c.flow.forEach((f, i) => {
    const row = i < 4 ? 0 : 1, col = row === 0 ? i : 3 - (i - 4);
    const x = MX + col * (bw + gap), y = row === 0 ? y1 : y2;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: bw, h: bh, rectRadius: 0.1, fill: { color: K.card }, line: { color: K.accent, width: 1.5 } });
    tx(s, rng[i], { x: x + 0.15, y: y + 0.1, w: bw - 0.3, h: 0.4, color: K.accent });
    tx(s, f.name, { x: x + 0.15, y: y + 0.5, w: bw - 0.3, h: 0.8, color: K.title });
    tx(s, f.who, { x: x + 0.15, y: y + 1.4, w: bw - 0.3, h: 0.4, color: K.body });
    tx(s, f.doc, { x: x + 0.15, y: y + 1.82, w: bw - 0.3, h: 0.8, color: K.yel });
    if (i !== 3 && i !== 7) {
      const ax = row === 0 ? x + bw + 0.02 : x - gap + 0.02;
      tx(s, row === 0 ? '\u2192' : '\u2190', { x: ax, y: y + bh / 2 - 0.25, w: gap - 0.04, h: 0.5, fontSize: 30, color: K.accent, align: 'center', valign: 'middle' });
    }
    if (i === 3) tx(s, '\u2193', { x: x + bw / 2 - 0.3, y: y1 + bh + 0.0, w: 0.6, h: 0.38, fontSize: 28, color: K.accent, align: 'center', valign: 'middle' });
  });
}
{ // roles
  const s = base('Who does what. Different people for ask, order, approve and pay: the lab shows this with its role switcher.');
  title(s, 'Who does what, in which module');
  const hdr = (t) => ({ text: t, options: { color: K.accent, fontFace: FONT, fontSize: 24, bold: false } });
  const rows = [[hdr('Step'), hdr('Person'), hdr('Module'), hdr('Document')]];
  c.flow.forEach((f, i) => rows.push([{ text: String(f.n) + ' ' + f.name }, { text: f.who }, { text: f.module }, { text: f.doc, options: { color: K.yel } }].map((cell) => ({ text: cell.text, options: Object.assign({ color: K.body, fontFace: FONT, fontSize: 24, bold: false }, cell.options || {}) }))));
  s.addTable(rows, { x: MX, y: 1.2, w: CW, colW: [3.3, 2.5, 4.4, 2.23], rowH: 0.56, border: { type: 'solid', pt: 0.75, color: K.line }, fill: { color: K.bg }, valign: 'middle', margin: [0.02, 0.08, 0.02, 0.08] });
}
function kvTable(s, rows, x, y, w, c1, rh) {
  const R = rows.map(([a, b, col]) => [{ text: a, options: { color: K.mute, fontFace: FONT, fontSize: 24, bold: false } }, { text: b, options: { color: col || K.title, fontFace: FONT, fontSize: 24, bold: false } }]);
  s.addTable(R, { x, y, w, colW: [c1, w - c1], rowH: rh || 0.52, border: { type: 'solid', pt: 0.75, color: K.line }, fill: { color: K.bg }, valign: 'middle', margin: [0.02, 0.08, 0.02, 0.08] });
}
{ // parties
  const s = base('Dummy teaching data: the GSTINs and addresses are not real registrations. Rajkot (Gujarat) buying from Mumbai (Maharashtra) makes the supply interstate, so the tax is IGST.');
  title(s, 'One example: the company and the supplier');
  kvTable(s, [['Company', d.company], ['Address', d.companyAddr], ['GSTIN', d.gstin], ['Business unit', d.ou], ['Receiving org', `${d.orgname} (${d.org})`], ['Supplier', `${d.supplier} (${d.supno})`], ['Address', d.supplierAddr], ['GSTIN', d.supgstin]], MX, 1.2, CW, 3.0, 0.58);
  tx(s, 'The GSTINs and addresses are dummy teaching data, not real registrations.', { x: MX, y: 6.55, w: CW, h: 0.5, color: K.yel });
}
{ // goods and docs
  const s = base('Same numbers on every screen of this deck, in the lab and in the guide.');
  title(s, 'One example: the goods, the money, the numbers');
  tx(s, 'Goods and money', { x: MX, y: 1.15, w: 6.0, h: 0.45, color: K.accent });
  kvTable(s, [['Item', `${d.itemdesc} (${d.category})`], ['Quantity x price', `${d.qty} ${d.uom} x \u20B9${d.price}`], ['Amount', `\u20B9${d.amount}`], ['IGST 18%', `\u20B9${d.igst}`], ['Invoice total', `\u20B9${d.total}`], ['Terms', d.terms]], MX, 1.7, 6.9, 2.4, 0.62);
  tx(s, 'Documents', { x: 7.75, y: 1.15, w: 5.0, h: 0.45, color: K.accent });
  kvTable(s, [['Requisition', d.req], ['Purchase order', d.po], ['Receipt', d.rcpt], ['Invoice', d.invno], ['Payment', d.payno]], 7.75, 1.7, 5.13, 2.3, 0.62);
  tx(s, `IGST because ${d.supplier} (Maharashtra) sells to ${d.companyShort} (Gujarat): an interstate supply, so one tax line.`, { x: MX, y: 5.65, w: CW, h: 1.0, color: K.body });
}
{ // people and dates
  const s = base('People and dates used on every screen.');
  title(s, 'One example: the people and the dates');
  kvTable(s, [['Requester', d.requester], ['Buyer', d.buyer], ['Approver', d.approver], ['Warehouse Receiver', d.receiver], ['AP Accountant', d.apclerk], ['Cashier', d.cashier]], MX, 1.2, 6.2, 2.7, 0.6);
  kvTable(s, [['Requisition date', d.f_req], ['PO date', d.f_po], ['Receipt date', d.f_rcpt], ['Invoice date', d.f_inv], ['Due and pay date', d.f_due]], 6.95, 1.2, 5.93, 2.65, 0.6);
}
{ // rules
  const s = base('Three rules the students should remember.');
  title(s, 'Three rules to remember');
  const items = c.notes;
  items.forEach((t, i) => {
    const y = 1.35 + i * 1.75;
    s.addShape(pres.shapes.OVAL, { x: MX, y: y + 0.05, w: 0.6, h: 0.6, fill: { color: K.card }, line: { color: K.accent, width: 1.5 } });
    tx(s, String(i + 1), { x: MX, y: y + 0.05, w: 0.6, h: 0.6, align: 'center', valign: 'middle', color: K.accent });
    tx(s, t, { x: MX + 0.9, y, w: CW - 0.9, h: 1.5, color: K.body });
  });
}
{ // books
  const s = base('Accounting entries in rupees. GR/IR = goods received, invoice not received. The invoice entry has a single Input IGST line (3 journal lines).');
  title(s, 'What the books show');
  const hd = (t) => ({ text: t, options: { color: K.accent, fontFace: FONT, fontSize: 24, bold: false } });
  const cell = (t, col) => ({ text: t, options: { color: col || K.body, fontFace: FONT, fontSize: 24, bold: false } });
  const rows = [[hd('Document'), hd('Entry'), hd('Then')]].concat(c.acct.map((r) => [cell(r[0], K.yel), cell(r[1]), cell(r[2])]));
  s.addTable(rows, { x: MX, y: 1.2, w: CW, colW: [2.7, 5.9, 3.83], rowH: [0.5, 1.4, 1.4, 1.0], border: { type: 'solid', pt: 0.75, color: K.line }, fill: { color: K.bg }, valign: 'middle', margin: [0.04, 0.1, 0.04, 0.1] });
  tx(s, `Net effect of the whole cycle: Dr Inventory \u20B9${d.amountsh}, Dr Input IGST \u20B9${d.igst}, Cr Bank \u20B9${d.totalsh}.`, { x: MX, y: 5.95, w: CW, h: 0.9, color: K.title });
}
{ // legend
  const s = base('How each step is laid out.');
  title(s, 'How each step is shown');
  chips(s, ['EBS R12 (older system)'], MX, 1.3, 4.6, K.ebs);
  tx(s, 'The screen and the click path in the E-Business Suite R12 forms. Students meet this at clients.', { x: 5.3, y: 1.3, w: 7.6, h: 0.9, color: K.body });
  chips(s, ['Fusion Cloud (current system)'], MX, 2.7, 5.2, K.fus);
  tx(s, 'The matching screen and click path in Oracle Fusion Cloud. The ICAI syllabus and our lab use this.', { x: 5.9, y: 2.7, w: 7.0, h: 0.9, color: K.body });
  tx(s, 'Every step has: the step and its click paths, the screens side by side, the values to type, then the button, the status change and the number generated.', { x: MX, y: 4.4, w: CW, h: 1.5, color: K.title });
}

// ---------- the ten steps ----------
const pathsH = (st) => {
  // dry-run chip heights to decide if intro and paths fit on one slide
  const rows = (items, w) => { let x = 0, r = 1; items.forEach((t, i) => { const cw = Math.min(estW(t), w), aw = i < items.length - 1 ? 0.5 : 0; if (x > 0 && x + cw + aw > w) { x = 0; r++; } x += cw + aw; }); return r; };
  return rows(st.ebs, CW) * 0.68 + rows(st.fusion, CW) * 0.68;
};
c.steps.forEach((st) => {
  const nt = `Step ${st.n} \u00B7 ${st.title}`;
  const tip = st.lab ? `Lab: ${st.lab}` : '';
  const notes = `${st.purpose}\n${tip}`;
  const need = 0.95 + 0.9 + 0.9 + pathsH(st) + 1.0;   // title+who/module + purpose + chip rows + two labels
  const together = need < 6.6;
  const intro = (s) => {
    tx(s, [{ text: 'Who  ', options: { color: K.mute } }, { text: st.who, options: { color: K.title } }, { text: '      Date  ', options: { color: K.mute } }, { text: st.date, options: { color: K.title } }], { x: MX, y: 1.1, w: CW, h: 0.45 });
    tx(s, [{ text: 'Module  ', options: { color: K.mute } }, { text: st.module, options: { color: K.title } }], { x: MX, y: 1.55, w: CW, h: 0.45 });
    return 2.1;
  };
  const sA = base(notes);
  title(sA, nt);
  let y = intro(sA);
  if (together) { tx(sA, st.purpose, { x: MX, y, w: CW, h: 0.85, color: K.body }); y += 0.95; }
  else {
    tx(sA, st.purpose, { x: MX, y: y + 0.2, w: CW, h: 1.6, color: K.body, fontSize: 28 });
    tx(sA, [{ text: 'Number generated  ', options: { color: K.mute } }, { text: st.number[0], options: { color: K.yel } }], { x: MX, y: 4.5, w: CW, h: 0.5 });
    if (st.lab) tx(sA, st.lab, { x: MX, y: 5.3, w: CW, h: 1.0, color: K.accent });
  }
  const sP = together ? sA : base(notes);
  if (!together) { title(sP, nt); sub2(sP, 'Click paths'); y = 1.55; }
  label(sP, 'ebs', MX, y, 6); y += 0.5;
  y = chips(sP, st.ebs, MX, y, CW, K.ebs) + 0.3;
  label(sP, 'fus', MX, y, 6); y += 0.5;
  const yEnd = chips(sP, st.fusion, MX, y, CW, K.fus);
  if (!together && yEnd + 1.9 < 7.2) {
    tx(sP, 'Button to press', { x: MX, y: yEnd + 0.4, w: CW, h: 0.45, color: K.mute });
    tx(sP, [{ text: st.button[0], options: { color: K.ebs, breakLine: true } }, { text: st.button[1], options: { color: K.fus } }], { x: MX, y: yEnd + 0.9, w: CW, h: 0.9 });
  }

  // screens
  st.screens.forEach((x) => {
    const wide = x.w > 1100;
    const e = `ppt/img/ebs-${x.id}.png`, f = `ppt/img/fus-${x.id}.png`;
    const sub = (t) => tx(t.s, `${(() => { const c0 = x.title.replace(/\s*\([^)]*\)/g, ''); return c0.length > 52 ? c0.split(' - ')[0] : c0; })()} \u00B7 manual page ${x.page}`, { x: MX, y: 0.95, w: CW, h: 0.45, color: K.mute });
    const short = (arr, mx) => (arr.length > mx ? ['\u2026'].concat(arr.slice(-mx)) : arr);
    if (!wide) {
      const s = base(`${x.title}. EBS manual page ${x.page}.`);
      title(s, nt, { h: 0.6, y: 0.28 }); sub({ s });
      const bw = 6.1, bh = 3.65, x2 = W - MX - bw;
      label(s, 'ebs', MX, 1.45, bw); label(s, 'fus', x2, 1.45, bw);
      pic(s, ROOT + '/' + e.replace('ppt/', ''), MX, 1.98, bw, bh, K.ebs);
      pic(s, ROOT + '/' + f.replace('ppt/', ''), x2, 1.98, bw, bh, K.fus);
      tx(s, arrowText(short(x.ebs, 3), K.ebs), { x: MX, y: 5.85, w: bw, h: 1.45, fontSize: 24 });
      tx(s, arrowText(short(x.fus, 3), K.fus), { x: x2, y: 5.85, w: bw, h: 1.45, fontSize: 24 });
    } else {
      const s1 = base(`${x.title}. EBS manual page ${x.page}.`);
      title(s1, nt, { h: 0.6, y: 0.28 }); sub({ s: s1 });
      label(s1, 'ebs', MX, 1.45, 8);
      pic(s1, ROOT + '/' + e.replace('ppt/', ''), MX, 1.98, CW, 4.2, K.ebs);
      tx(s1, arrowText(x.ebs, K.ebs), { x: MX, y: 6.4, w: CW, h: 0.9 });
      const s2 = base(`${x.title}. Fusion Cloud screen.`);
      title(s2, nt, { h: 0.6, y: 0.28 }); sub({ s: s2 });
      label(s2, 'fus', MX, 1.45, 8);
      pic(s2, ROOT + '/' + f.replace('ppt/', ''), MX, 1.98, 7.2, 4.3, K.fus);
      tx(s2, 'Click path', { x: 8.1, y: 1.98, w: 4.78, h: 0.45, color: K.mute });
      chipsV(s2, x.fus, 8.1, 2.5, 4.78, K.fus);
    }
  });

  // values
  const sV = base(`Values to type on the screens of step ${st.n}.`);
  title(sV, nt); sub2(sV, 'Values on the screen');
  kvTable(sV, st.fields, MX, 1.55, CW, 4.2, 0.5);
  // result
  const sR = base(`Result of step ${st.n}.`);
  title(sR, nt); sub2(sR, 'The result');
  tx(sR, 'Number generated', { x: MX, y: 1.6, w: 5.5, h: 0.45, color: K.mute });
  tx(sR, st.number[0], { x: MX, y: 2.1, w: 6.2, h: 1.0, fontSize: 40, color: K.yel, valign: 'middle' });
  tx(sR, 'Used next', { x: MX, y: 3.4, w: 5.5, h: 0.45, color: K.mute });
  tx(sR, st.number[1], { x: MX, y: 3.9, w: 5.9, h: 2.8, color: K.body });
  const rx = 6.9, rw = W - MX - rx;
  tx(sR, 'Button to press', { x: rx, y: 1.6, w: rw, h: 0.45, color: K.mute });
  const b = st.button;
  tx(sR, [{ text: b[0], options: { color: K.ebs, breakLine: true } }, { text: b[1], options: { color: K.fus } }], { x: rx, y: 2.1, w: rw, h: 1.5 });
  tx(sR, 'Status before and after', { x: rx, y: 3.8, w: rw, h: 0.45, color: K.mute });
  chipsV(sR, st.status, rx, 4.35, rw, K.grn);
});

// ---------- closing ----------
{
  const s = base('Companion files.');
  title(s, 'One chain of numbers, one set of files');
  chips(s, [d.req, d.po, d.rcpt, d.invno, d.payno], MX, 1.3, CW, K.accent);
  tx(s, [
    { text: 'Tutor quick guide (PDF): ', options: { color: K.mute } }, { text: 'P2P-tutor-quick-guide.pdf, in 04 Practice Manuals', options: { color: K.title, breakLine: true } },
    { text: 'Other classroom deck: ', options: { color: K.mute } }, { text: 'AITT - Oracle Fusion ERP - Classroom PPT.pptx, same folder as this file', options: { color: K.title, breakLine: true } },
    { text: 'Source of truth: ', options: { color: K.mute } }, { text: '10 Source of Truth (one data file feeds the lab, the guide and this deck)', options: { color: K.title, breakLine: true } },
    { text: 'Live lab and screens: ', options: { color: K.mute } }, { text: 'ca-darshak-m-thakkar.github.io/oracle-fusion-ca-lab, then #ebs-replica', options: { color: K.title } },
  ], { x: MX, y: 2.6, w: CW, h: 3.9, paraSpaceAfter: 10 });
}
pres.writeFile({ fileName: ROOT + '/AITT - Oracle Fusion - P2P Classroom PPT (EBS and Fusion).pptx' }).then((f) => console.log('wrote', f));
