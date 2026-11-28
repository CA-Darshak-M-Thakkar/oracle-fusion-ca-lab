import React from 'react';
import { fill, DATASETS } from './EbsWindow';
import metaJson from '../../../data/ebs/fusion-meta.json';

const META = metaJson as unknown as { navigator: [string, string[]][]; tasks: Record<string, string[]>; users: Record<string, string> };
const RED = '#c74634';
const INK = '#312d2a';
const LINE = '#c4ced4';
const MUTED = '#6b6560';

/** Click-path strip: numbered chips joined by arrows. Used under both the EBS window and the Fusion window. */
export const ClickPath: React.FC<{ steps: string[]; color: string; label: string; press?: string }> = ({ steps, color, label, press }) => (
  <div data-testid="click-path" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: '8px 10px', background: '#fff', border: `1px solid ${color}`, borderTop: 'none', fontSize: 13, lineHeight: '20px', color: INK }}>
    <b style={{ color, marginRight: 4 }}>{label}</b>
    {steps.map((s, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span style={{ color, fontWeight: 700, fontSize: 15 }}>➜</span>}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f4f1ee', border: `1px solid ${LINE}`, borderRadius: 14, padding: '1px 10px 1px 3px' }}>
          <span style={{ background: color, color: '#fff', borderRadius: 10, minWidth: 18, height: 18, lineHeight: '18px', textAlign: 'center', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
          {s}
        </span>
      </React.Fragment>
    ))}
    {press && (
      <>
        <span style={{ color, fontWeight: 700, fontSize: 15 }}>➜</span>
        <span style={{ border: `2px solid ${color}`, borderRadius: 14, padding: '0 10px', fontWeight: 600 }}>Press: {press}</span>
      </>
    )}
  </div>
);

const Chevron = () => <span style={{ margin: '0 6px', color: MUTED }}>›</span>;

const Btn: React.FC<{ t: string; primary: boolean; press: boolean }> = ({ t, primary, press }) => (
  <span style={{ position: 'relative', padding: '6px 16px', borderRadius: 18, border: primary ? 'none' : `1px solid ${INK}`, background: primary ? INK : '#fff', color: primary ? '#fff' : INK, fontSize: 13, outline: press ? `3px solid ${RED}` : 'none', outlineOffset: 2 }}>
    {t}
    {press && <span style={{ position: 'absolute', top: -14, right: -10, background: RED, color: '#fff', borderRadius: 10, width: 20, height: 20, lineHeight: '20px', textAlign: 'center', fontSize: 12, fontWeight: 700 }}>★</span>}
  </span>
);

const Badge: React.FC<{ t: string; bg: string; fg: string }> = ({ t, bg, fg }) => (
  <span style={{ background: bg, color: fg, borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{t}</span>
);

/** Fusion Cloud counterpart: global header (Navigator, Home, Favorites, bell, user), springboard or work area with breadcrumb, Tasks panel, content. */
export const FusionView: React.FC<{ spec: any; dataset?: string }> = ({ spec, dataset = 'abc' }) => {
  const ds = DATASETS[dataset] ?? DATASETS.abc;
  const F = (v: any) => fill(v, ds);
  const who = ds[spec.user] || '';
  const role = META.users[spec.user] || '';
  const initials = who.split(' ').map((p: string) => p[0]).join('');
  const home = spec.kind === 'home';
  const tasks = spec.tasks ? META.tasks[spec.tasks] : null;
  const crumbs: string[] = spec.crumbs ?? ['Home', ...(spec.group ? [spec.group] : []), ...(spec.area ? [spec.area] : []), ...(spec.title && !home ? [F(spec.title)] : [])];
  const notif = spec.kind === 'notification';
  return (
    <div data-testid="fusion-view" style={{ width: 760, background: '#fbf9f8', color: INK, border: `1px solid ${LINE}`, borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, overflow: 'hidden', flex: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderBottom: `1px solid ${LINE}`, padding: '8px 14px' }}>
        <span title="Navigator" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: `1px solid ${LINE}`, borderRadius: 4, padding: '2px 8px', outline: home ? `2px solid ${RED}` : 'none' }}><span style={{ fontSize: 18 }}>☰</span><span style={{ fontSize: 12 }}>Navigator</span></span>
        <span style={{ color: RED, fontWeight: 700, letterSpacing: 2, fontSize: 15 }}>ORACLE</span>
        <span style={{ color: MUTED }}>Fusion Applications</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, color: MUTED }}>
          <span>⌂ Home</span><span>☆</span>
          <span style={{ position: 'relative', outline: notif ? `2px solid ${RED}` : 'none', borderRadius: 4, padding: '0 3px' }}>🔔<span style={{ position: 'absolute', top: -6, right: -6, background: RED, color: '#fff', borderRadius: 8, fontSize: 10, padding: '0 4px' }}>1</span></span>
          <span title={who} style={{ background: '#6b6560', color: '#fff', borderRadius: 14, width: 28, height: 28, lineHeight: '28px', textAlign: 'center', fontSize: 12 }}>{initials}</span>
        </span>
      </div>
      {who && <div style={{ padding: '4px 14px', fontSize: 12, color: MUTED, borderBottom: `1px solid ${LINE}`, background: '#f4f1ee' }}>Signed in as <b style={{ color: INK }}>{who}</b> ({role})</div>}
      {home ? (
        <div style={{ display: 'flex', minHeight: 330 }}>
          <div style={{ width: 250, background: '#fff', borderRight: `1px solid ${LINE}`, padding: '8px 0', fontSize: 13 }}>
            <div style={{ padding: '4px 14px', color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>Navigator</div>
            <div style={{ padding: '5px 14px' }}>⌂ Home</div>
            {META.navigator.map(([g, items]) => (
              <div key={g}>
                <div style={{ padding: '5px 14px', fontWeight: 600, background: g === spec.group ? '#fdf0ee' : 'transparent' }}>{g === spec.group ? '▾' : '▸'} {g}</div>
                {g === spec.group && items.map((it) => (
                  <div key={it} style={{ padding: '4px 14px 4px 34px', color: it === spec.hl ? '#fff' : INK, background: it === spec.hl ? RED : 'transparent', borderRadius: 3, margin: '0 8px' }}>{it}</div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, padding: '14px 18px' }}>
            <div style={{ fontSize: 20, fontWeight: 300, marginBottom: 10 }}>Good morning, {who.split(' ')[0]}</div>
            <div style={{ color: MUTED, fontSize: 12, marginBottom: 8 }}>Springboard: your work areas</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {['Purchase Requisitions', 'Purchase Orders', 'My Receipts', 'Invoices', 'Payments', 'Journals'].map((t, i) => (
                <div key={t} style={{ background: '#fff', border: `1px solid ${t === spec.hl ? RED : LINE}`, borderRadius: 8, padding: '12px 8px', textAlign: 'center', fontSize: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 17, background: ['#c74634', '#2d84c5', '#5a8a3a', '#b8860b', '#6a4c93', '#3a7d8a'][i], margin: '0 auto 6px', color: '#fff', lineHeight: '34px', fontWeight: 700 }}>{t[0]}</div>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ flex: 1, padding: '12px 16px', minWidth: 0 }}>
            <div data-testid="breadcrumb" style={{ color: MUTED, fontSize: 12, marginBottom: 6 }}>
              {crumbs.map((c, i) => <React.Fragment key={i}>{i > 0 && <Chevron />}<span style={{ color: i === crumbs.length - 1 ? INK : '#1f5fa8' }}>{c}</span></React.Fragment>)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 22, fontWeight: 300 }}>{F(spec.title)}</div>
              {spec.status && <><Badge t={F(spec.status[0])} bg="#eceae7" fg={INK} /><span style={{ color: RED, fontWeight: 700 }}>➜</span><Badge t={F(spec.status[1])} bg="#e3f1e0" fg="#245c1c" /></>}
            </div>
            <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 6, padding: 12 }}>
              {(spec.fields || []).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
                  {(spec.fields || []).map((f: any, i: number) => (
                    <label key={i} style={{ display: 'block' }}>
                      <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>{f[0]}</div>
                      <div style={{ border: `1px solid ${LINE}`, borderRadius: 4, padding: '5px 8px', minHeight: 20, background: '#fff' }}>{F(f[1])}</div>
                    </label>
                  ))}
                </div>
              )}
              {spec.table && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                  <thead><tr>{spec.table.cols.map((c: string) => <th key={c} style={{ textAlign: 'left', borderBottom: `2px solid ${LINE}`, padding: 6, fontSize: 12 }}>{c}</th>)}</tr></thead>
                  <tbody>{spec.table.rows.map((r: any[], i: number) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: 6, borderBottom: `1px solid ${LINE}`, fontSize: 13 }}>{F(c)}</td>)}</tr>)}</tbody>
                </table>
              )}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                {(spec.actions || []).map((a: string, i: number, arr: string[]) => <Btn key={a} t={a} primary={i === arr.length - 1} press={spec.press === a} />)}
              </div>
            </div>
          </div>
          {tasks && (
            <div data-testid="tasks-panel" style={{ width: 190, borderLeft: `1px solid ${LINE}`, background: '#fff', padding: '10px 0', fontSize: 13, flex: 'none' }}>
              <div style={{ padding: '2px 12px 8px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}><span>☷ Tasks</span><span style={{ color: MUTED }}>✕</span></div>
              <div style={{ padding: '2px 12px 6px', color: MUTED, fontSize: 11 }}>{spec.area}</div>
              {tasks.map((t) => (
                <div key={t} style={{ padding: '6px 12px', background: t === spec.task ? '#fdf0ee' : 'transparent', borderLeft: `3px solid ${t === spec.task ? RED : 'transparent'}`, color: t === spec.task ? RED : '#1f5fa8', fontWeight: t === spec.task ? 600 : 400 }}>{t}</div>
              ))}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '0 16px 12px' }}>
        {spec.lab && <div style={{ marginTop: 8, fontSize: 12.5, color: '#1f3d6b', background: '#eaf1fb', border: '1px solid #b9cde8', borderRadius: 6, padding: '6px 10px' }}>{F(spec.lab)}</div>}
        {spec.note && <div style={{ marginTop: 8, fontSize: 13, color: '#4a4540', background: '#fff7e0', border: '1px solid #f0d78c', borderRadius: 6, padding: '8px 10px' }}>{F(spec.note)}</div>}
      </div>
    </div>
  );
};
