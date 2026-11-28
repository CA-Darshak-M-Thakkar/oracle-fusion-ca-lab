import React from 'react';
import screensJson from '../../../data/ebs/screens.json';
import themeJson from '../../../data/ebs/theme.json';
import dataJson from '../../../data/ebs/data.json';

export type El = any[];
export interface EbsScreen {
  id: string; step: number; stepTitle: string; title: string; ctl?: string; chrome?: boolean;
  w: number; h: number; ref?: string; page?: number; responsibility?: string; nav?: string;
  bg?: string; ty?: number; noManualImage?: boolean; els: El[]; fusion: any;
}
export const SCREENS = screensJson as unknown as EbsScreen[];
export const THEME = themeJson as any;
export const DATASETS = (dataJson as any).datasets as Record<string, Record<string, string>>;
const C = THEME.colors;

export const fill = (s: any, ds: Record<string, string>): any =>
  typeof s === 'string' ? s.replace(/\{\{(\w+)\}\}/g, (_, k) => ds[k] ?? '') : s;

const FR = THEME.chrome.frame as number;
const abs = (x: number, y: number, w?: number, h?: number, extra: React.CSSProperties = {}): React.CSSProperties => ({
  position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', ...extra,
});
const fl = (f: any) => (typeof f === 'string' ? f : (f && f.f) || '');

function Txt({ x, y, text, f, W }: { x: number; y: number; text: string; f: any; W: number }) {
  const o = typeof f === 'object' && f ? f : {};
  const s = fl(f);
  const st: React.CSSProperties = {
    position: 'absolute', top: y - 8, lineHeight: '16px', whiteSpace: 'pre', color: C.text,
  };
  if (s.includes('r')) st.right = W - x; else if (s.includes('c')) { st.left = x; st.transform = 'translateX(-50%)'; } else st.left = x;
  if (s.includes('b')) st.fontWeight = 700;
  if (s.includes('g')) st.color = C.textDisabled;
  if (s.includes('w')) st.color = '#fff';
  if (s.includes('m')) { st.fontFamily = THEME.mono; st.fontSize = 12; }
  if (o.color) st.color = o.color;
  if (o.size) { st.fontSize = o.size; st.lineHeight = o.size + 4 + 'px'; st.top = y - (o.size + 4) / 2; }
  if (o.font) st.fontFamily = o.font;
  if (s.includes('k')) st.textDecoration = 'underline';
  return <div style={st}>{text}</div>;
}

function Field({ x, y, w, h, v, f }: any) {
  const s = f as string;
  let bg = C.white, bd = C.fieldBorder, col = C.text;
  if (s.includes('y')) bg = C.required;
  if (s.includes('r')) { bg = C.cell; bd = C.cellBorder; }
  if (s.includes('h')) bg = C.highlight;
  return (
    <div style={abs(x, y, w, h, { background: bg, border: `1px solid ${bd}`, borderRadius: 2, color: col, lineHeight: `${h - 2}px`, paddingLeft: 3, paddingRight: 3, overflow: 'hidden', whiteSpace: 'nowrap', textAlign: s.includes('R') ? 'right' : 'left' })}>
      {s.includes('s') && v ? <span style={{ background: C.listSelected, color: '#fff', padding: '1px 1px' }}>{v}</span> : v}
      {s.includes('p') && <span style={{ position: 'absolute', right: 3, top: 0, color: '#6b7f9e', fontSize: 9 }}>▼</span>}
    </div>
  );
}

function Btn({ x, y, w, h, t, f }: any) {
  const dis = f.includes('d');
  return (
    <div style={abs(x, y, w, h, { background: dis ? '#dbe6f1' : `linear-gradient(#dfeaf6,${C.button})`, border: `1px solid ${dis ? '#a9bbd0' : C.buttonBorder}`, borderRadius: Math.min(13, h / 2), textAlign: 'center', lineHeight: `${h - 2}px`, color: dis ? C.textDisabled : C.text, boxShadow: f.includes('D') ? 'inset 0 0 0 1px #5c7ba3' : undefined, whiteSpace: 'nowrap' })}>{t}</div>
  );
}

function Check({ x, y, t, on, dis, radio }: any) {
  const c = dis ? C.textDisabled : C.text;
  return (
    <>
      <div style={abs(x, y - 6, 12, 12, { background: dis ? C.cell : '#fff', border: `1px solid ${dis ? '#aebccf' : '#6f86a6'}`, borderRadius: radio ? 6 : 1, fontSize: 11, lineHeight: '10px', textAlign: 'center', color: c })}>
        {on ? (radio ? <div style={{ width: 4, height: 4, borderRadius: 2, background: c, margin: '3px auto' }} /> : '✔') : ''}
      </div>
      <Txt x={x + 15} y={y} text={t} f={dis ? 'g' : ''} W={0} />
    </>
  );
}

function VScroll({ x, y, h }: any) {
  return (
    <div style={abs(x, y, 15, h, { background: C.tabInactive, border: `1px solid ${C.cellBorder}`, fontSize: 8, color: '#4b6a93', textAlign: 'center' })}>
      <div style={{ lineHeight: '14px' }}>▲</div>
      <div style={{ position: 'absolute', top: 16, bottom: 16, left: 1, right: 1, background: C.tabActive, opacity: 0.55 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, lineHeight: '14px' }}>▼</div>
    </div>
  );
}
function HScroll({ x, y, w }: any) {
  return (
    <div style={abs(x, y, w, 15, { background: C.tabInactive, border: `1px solid ${C.cellBorder}`, fontSize: 8, color: '#4b6a93' })}>
      <span style={{ position: 'absolute', left: 3, top: 0, lineHeight: '13px' }}>◀</span>
      <div style={{ position: 'absolute', left: '28%', right: 16, top: 1, bottom: 1, background: C.tabActive, opacity: 0.55 }} />
      <span style={{ position: 'absolute', right: 3, top: 0, lineHeight: '13px' }}>▶</span>
    </div>
  );
}

function Ico({ x, y, k }: any) {
  const sq = k === 'plus' || k === 'minus';
  const s = sq ? 24 : 26;
  const dis = k === 'arrowL';
  const glyph = k === 'plus' ? '✚' : k === 'minus' ? '▬' : k === 'arrowR' ? '➔' : '➔';
  return (
    <div style={abs(x, y, s, s, { background: dis ? '#dbe6f1' : C.button, border: `1px solid ${dis ? '#b5c3d6' : C.buttonBorder}`, borderRadius: 3, textAlign: 'center', lineHeight: `${s - 2}px`, color: dis ? '#a9b8cc' : k === 'arrowR' ? '#c0392b' : '#2f5fa8', fontSize: 14, transform: k === 'arrowL' ? 'scaleX(-1)' : undefined })}>{glyph}</div>
  );
}

function Grid({ el, ds, W }: { el: El; ds: Record<string, string>; W: number }) {
  const [, y0, rh, n, cols, rows, o] = el as [string, number, number, number, any[], any[], any];
  const opt = o || {};
  const out: React.ReactNode[] = [];
  const hy = opt.hy ?? y0 - 9;
  cols.forEach((c, ci) => {
    const [hdr, x, w] = c;
    if (opt.hdrBox) {
      out.push(<div key={'h' + ci} style={abs(x, y0 - (opt.hh || 24) - 2, w, opt.hh || 24, { background: C.cell, border: `1px solid ${C.cellBorder}`, borderRadius: 3, lineHeight: `${(opt.hh || 24) - 2}px`, paddingLeft: 4, whiteSpace: 'pre', overflow: 'hidden' })}>{hdr}</div>);
    } else {
      out.push(<Txt key={'h' + ci} x={x + 2} y={hy} text={hdr} f="" W={W} />);
    }
  });
  for (let r = 0; r < n; r++) {
    const y = y0 + r * rh;
    const row = rows[r];
    const sel = opt.rowSel && r === 0;
    if (opt.mark != null) out.push(<div key={'m' + r} style={abs(opt.mark, y, 14, rh - 4, { background: r === 0 ? '#14148c' : C.cell, border: `1px solid ${C.cellBorder}`, borderRadius: 2 })} />);
    if (opt.chk != null) out.push(<div key={'c' + r} style={abs(opt.chk, y + 4, 12, 12, { background: row ? '#fff' : C.cell, border: `1px solid ${row ? '#6f86a6' : C.cellBorder}`, fontSize: 11, lineHeight: '10px', textAlign: 'center' })}>{row && opt.chkOn !== false ? '✔' : ''}</div>);
    cols.forEach((c, ci) => {
      const [, x, w, st] = c;
      let raw = row ? row[ci] : undefined;
      let f = row ? (st || 'r') : 'r';
      let bold = false;
      if (Array.isArray(raw)) { const fl2 = String(raw[1] || ''); raw = raw[0]; if (fl2.includes('h')) f = f + 'h'; if (fl2.includes('b')) bold = true; }
      let bg = C.cell, bd = C.cellBorder;
      if (row) { if (f.includes('h')) bg = C.highlight; else if (f.includes('y') && raw) bg = C.required; else if (f.includes('w')) bg = C.white; else if (f.includes('y') && !raw) bg = C.required; }
      if (sel) bg = C.rowSelected;
      out.push(
        <div key={`${r}-${ci}`} style={abs(x, y, w, rh - 4, { background: bg, border: `1px solid ${bd}`, borderRadius: 2, lineHeight: `${rh - 6}px`, paddingLeft: 3, paddingRight: 3, whiteSpace: 'nowrap', overflow: 'hidden', textAlign: f.includes('R') ? 'right' : 'left', fontWeight: bold ? 700 : undefined })}>{fill(raw ?? '', ds)}</div>
      );
    });
    if (opt.lastCol != null) out.push(<div key={'l' + r} style={abs(opt.lastCol, y, 17, rh - 4, { background: C.cell, border: `1px solid ${C.cellBorder}`, borderRadius: 2 })} />);
  }
  if (opt.lastCol != null) out.push(<Txt key="lh" x={opt.lastCol} y={hy} text="[ ]" f="" W={W} />);
  return <div style={{ position: 'absolute', left: 0, top: 0, width: opt.clipX ?? W, height: y0 + n * rh + 40, overflow: 'hidden' }}>{out}</div>;
}

function renderEl(el: El, i: number, ds: Record<string, string>, W: number): React.ReactNode {
  const k = el[0];
  const F = (v: any) => fill(v, ds);
  switch (k) {
    case 't': return <Txt key={i} x={el[1]} y={el[2]} text={F(el[3])} f={el[4] ?? ''} W={W} />;
    case 'f': return <Field key={i} x={el[1]} y={el[2]} w={el[3]} h={el[4]} v={F(el[5])} f={el[6] ?? ''} />;
    case 'b': return <Btn key={i} x={el[1]} y={el[2]} w={el[3]} h={el[4]} t={F(el[5])} f={el[6] ?? ''} />;
    case 'tabs': {
      const [, y, h, tabs, active, dis] = el;
      return <React.Fragment key={i}>{tabs.map((t: any, ti: number) => (
        <div key={ti} style={abs(t[1], y, t[2], h + (ti === active ? 2 : 0), { background: ti === active ? C.tabActive : C.tabInactive, border: `1px solid ${C.tabBorder}`, borderBottom: 'none', borderRadius: '6px 6px 0 0', textAlign: 'center', lineHeight: `${h}px`, color: (dis || []).includes(ti) ? C.textDisabled : C.text, whiteSpace: 'nowrap', overflow: 'hidden' })}>{t[0]}</div>
      ))}</React.Fragment>;
    }
    case 'panel': return <div key={i} style={abs(el[1], el[2], el[3], el[4], { border: `1px solid ${C.panelBorder}`, borderRadius: 8 })} />;
    case 'grp': return (
      <React.Fragment key={i}>
        <div style={abs(el[1], el[2], el[3], el[4], { border: `1px solid ${C.panelBorder}`, borderRadius: 8 })} />
        <div style={{ position: 'absolute', left: el[1] + 7, top: el[2] - 9, lineHeight: '16px', background: el[7] ?? C.body, padding: '0 2px', color: C.text }}>{el[5]}</div>
      </React.Fragment>
    );
    case 'rect': return <div key={i} style={abs(el[1], el[2], el[3], el[4], { background: String(el[5]).startsWith('grad:') ? `linear-gradient(${String(el[5]).slice(5)})` : el[5], border: el[6] ? `1px solid ${el[6]}` : undefined, borderRadius: el[7] || 0 })} />;
    case 'grid': return <Grid key={i} el={el} ds={ds} W={W} />;
    case 'radio': return <Check key={i} x={el[1]} y={el[2]} t={F(el[3])} on={el[4]} dis={el[5]} radio />;
    case 'chk': return <Check key={i} x={el[1]} y={el[2]} t={F(el[3])} on={el[4]} dis={el[5]} />;
    case 'vscroll': return <VScroll key={i} x={el[1]} y={el[2]} h={el[3]} />;
    case 'hscroll': return <HScroll key={i} x={el[1]} y={el[2]} w={el[3]} />;
    case 'ico': return <Ico key={i} x={el[1]} y={el[2]} k={el[3]} />;
    case 'pre': return <div key={i} style={{ position: 'absolute', left: el[1], top: el[2], width: el[3], whiteSpace: 'pre', fontFamily: THEME.mono, fontSize: 12.5, lineHeight: '15px', color: '#000' }}>{F(el[4])}</div>;
    default: return null;
  }
}

export const EbsWindow: React.FC<{ screen: EbsScreen; dataset: string; testId?: boolean }> = ({ screen, dataset, testId }) => {
  const ds = DATASETS[dataset] ?? DATASETS.abc;
  const W = screen.w;
  const chrome = screen.chrome !== false;
  const ctl = screen.ctl ?? 'mmc';
  const ty = screen.ty ?? 9;
  const tw = W - 11 - 9;
  const closeX = W - 14 - 17;
  return (
    <div data-testid={testId ? `ebs-${screen.id}` : undefined} data-ebs-screen={screen.id}
      style={{ position: 'relative', width: W - 2 * FR, height: screen.h - 2 * FR, overflow: 'hidden', background: screen.bg ?? C.body, fontFamily: THEME.font, fontSize: THEME.fontSize, color: C.text, flex: 'none' }}>
      <div style={{ position: 'absolute', left: -FR, top: -FR, width: W, height: screen.h }}>
        {chrome && (
          <div style={abs(9, ty, tw, 20, { background: C.titlebar, color: '#fff', lineHeight: '20px', whiteSpace: 'nowrap' })}>
            <span style={{ display: 'inline-block', width: 14, height: 10, border: '2px solid #e0301e', borderRadius: 5, background: '#fff', margin: '0 3px 0 3px', verticalAlign: -1, boxSizing: 'border-box' }} />
            {fill(screen.title, ds)}
            {[...ctl].reverse().map((c, i) => (
              <span key={i} style={{ position: 'absolute', top: 2, right: 3 + i * 20, width: 17, height: 15, background: '#5aa0d8', border: '1px solid #b9dcf5', textAlign: 'center', lineHeight: '13px', fontSize: 11, fontWeight: 700 }}>{c === 'c' ? '✕' : c === 'm' && i === ctl.length - 1 ? '▁' : c === 'm' ? '▢' : ''}</span>
            ))}
          </div>
        )}
        {screen.els.map((e, i) => renderEl(e, i, ds, W))}
      </div>
    </div>
  );
};
