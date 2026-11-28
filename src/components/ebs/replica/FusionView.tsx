import React from 'react';
import { fill, DATASETS } from './EbsWindow';

/** Redwood-style view of the matching Fusion Cloud screen, generated from the `fusion` block in p2p.yaml. */
export const FusionView: React.FC<{ spec: any; dataset: string }> = ({ spec, dataset }) => {
  const ds = DATASETS[dataset] ?? DATASETS.manual;
  const F = (v: any) => fill(v, ds);
  const line = '#c4ced4';
  return (
    <div data-testid="fusion-view" style={{ width: 640, background: '#fbf9f8', color: '#161513', border: `1px solid ${line}`, borderRadius: 6, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 14, overflow: 'hidden', flex: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderBottom: `1px solid ${line}`, padding: '8px 14px' }}>
        <span style={{ fontSize: 18 }}>☰</span>
        <span style={{ color: '#c74634', fontWeight: 700, letterSpacing: 2, fontSize: 15 }}>ORACLE</span>
        <span style={{ color: '#6b6560' }}>Fusion Applications</span>
        <span style={{ marginLeft: 'auto', color: '#6b6560' }}>⌂ ☆ 🔔</span>
      </div>
      <div style={{ padding: '14px 18px' }}>
        <div style={{ color: '#6b6560', fontSize: 12, marginBottom: 6 }}>{F(spec.path)}</div>
        <div style={{ fontSize: 22, fontWeight: 300, marginBottom: 12 }}>{F(spec.title)}</div>
        {spec.kind === 'navigator' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {spec.groups.map((g: any, i: number) => (
              <div key={i} style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: 6, padding: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{g[0]}</div>
                {g[1].map((it: string) => <div key={it} style={{ padding: '3px 0', color: it === 'Purchase Requisitions' ? '#c74634' : '#312d2a' }}>{it}</div>)}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: '#fff', border: `1px solid ${line}`, borderRadius: 6, padding: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
              {(spec.fields || []).map((f: any, i: number) => (
                <label key={i} style={{ display: 'block' }}>
                  <div style={{ fontSize: 12, color: '#6b6560', marginBottom: 2 }}>{f[0]}</div>
                  <div style={{ border: `1px solid ${line}`, borderRadius: 4, padding: '6px 8px', minHeight: 20, background: '#fff' }}>{F(f[1])}</div>
                </label>
              ))}
            </div>
            {spec.table && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
                <thead><tr>{spec.table.cols.map((c: string) => <th key={c} style={{ textAlign: 'left', borderBottom: `2px solid ${line}`, padding: 6, fontSize: 12 }}>{c}</th>)}</tr></thead>
                <tbody>{spec.table.rows.map((r: any[], i: number) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: 6, borderBottom: `1px solid ${line}` }}>{F(c)}</td>)}</tr>)}</tbody>
              </table>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              {(spec.actions || []).map((a: string, i: number, arr: string[]) => (
                <span key={a} style={{ padding: '6px 14px', borderRadius: 18, border: i === arr.length - 1 ? 'none' : `1px solid #312d2a`, background: i === arr.length - 1 ? '#312d2a' : '#fff', color: i === arr.length - 1 ? '#fff' : '#312d2a', fontSize: 13 }}>{a}</span>
              ))}
            </div>
          </div>
        )}
        {spec.note && <div style={{ marginTop: 12, fontSize: 13, color: '#4a4540', background: '#fff7e0', border: '1px solid #f0d78c', borderRadius: 6, padding: '8px 10px' }}>{spec.note}</div>}
      </div>
    </div>
  );
};
