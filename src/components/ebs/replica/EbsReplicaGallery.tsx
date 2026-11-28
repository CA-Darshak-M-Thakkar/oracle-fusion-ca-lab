import React, { useEffect, useState } from 'react';
import { EbsWindow, SCREENS, THEME, DATASETS } from './EbsWindow';
import { FusionView } from './FusionView';
import hashInfo from '../../../data/ebs/source-hash.json';

const LAB_ROUTE: Record<string, string> = { requisition_form: 'purchase_requisitions', find_requisitions: 'manage_requisitions', po_form: 'purchase_orders', receipts: 'my_receipts', invoice_workbench: 'payables_invoices', payments: 'payables_payments' };

/** Gallery: each EBS R12 screen (CSS replica) next to its Fusion Cloud counterpart. Routes: #ebs-replica, #ebs-replica/<screen-id> (1:1 single window). */
export const EbsReplicaGallery: React.FC = () => {
  const [ds, setDs] = useState<string>('manual');
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => { const f = () => setHash(window.location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const parts = hash.replace(/^#/, '').split('/');
  const only = parts[1]?.split('?')[0];
  const q = new URLSearchParams(hash.split('?')[1] || '');
  const dsq = q.get('data') || ds;
  if (only) {
    const s = SCREENS.find((x) => x.id === only);
    if (!s) return <div>Unknown screen</div>;
    return <div style={{ padding: 0, background: '#fff', display: 'inline-block' }}><EbsWindow screen={s} dataset={dsq} testId /></div>;
  }
  return (
    <div style={{ background: '#f4f1ee', minHeight: '100vh', padding: 20, fontFamily: 'Inter, system-ui, sans-serif', color: '#161513' }}>
      <a href="#" style={{ color: '#c74634', fontSize: 14 }}>← Back to the lab</a>
      <h1 style={{ fontSize: 26, fontWeight: 600 }}>Procure to Pay: EBS R12 screens next to Oracle Fusion Cloud</h1>
      <p style={{ maxWidth: 900, fontSize: 16, color: '#4a4540' }}>
        Left: the older E-Business Suite R12 screen, rebuilt from the P2P manual (<b>{THEME.labels.ebs}</b>). Right: the matching screen in <b>{THEME.labels.fusion}</b>, which is what the ICAI syllabus teaches. The classes use Fusion; the EBS screens help students who meet the old system at clients.
      </p>
      <div style={{ display: 'flex', gap: 8, margin: '10px 0 18px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span>Numbers shown:</span>
        {Object.keys(DATASETS).map((k) => (
          <button key={k} data-testid={`ds-${k}`} onClick={() => setDs(k)} style={{ padding: '6px 12px', borderRadius: 16, border: '1px solid #312d2a', background: ds === k ? '#312d2a' : '#fff', color: ds === k ? '#fff' : '#312d2a', cursor: 'pointer' }}>{DATASETS[k].label}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b6560' }}>generated from p2p-source ({(hashInfo as any).sourceHash}, {(hashInfo as any).screens} screens)</span>
      </div>
      {SCREENS.map((s) => (
        <section key={s.id} id={s.id} style={{ marginBottom: 34 }}>
          <h2 style={{ fontSize: 20, margin: '0 0 4px' }}>Step {s.step} · {s.stepTitle}</h2>
          <div style={{ fontSize: 14, color: '#4a4540', marginBottom: 8 }}>
            EBS: <b>{s.responsibility}</b> · Navigation: <b>{s.nav}</b> · Manual page {s.page}{LAB_ROUTE[s.id] ? <> · <a href={`#${LAB_ROUTE[s.id]}`} style={{ color: '#c74634' }}>open the Fusion lab screen</a></> : null}
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 6 }}>
            <div>
              <div style={{ background: '#2d84c5', color: '#fff', padding: '4px 10px', fontWeight: 600, fontSize: 14, borderRadius: '4px 4px 0 0' }}>{THEME.labels.ebs}</div>
              <EbsWindow screen={s} dataset={ds} />
            </div>
            <div>
              <div style={{ background: '#c74634', color: '#fff', padding: '4px 10px', fontWeight: 600, fontSize: 14, borderRadius: '4px 4px 0 0' }}>{THEME.labels.fusion}</div>
              <FusionView spec={s.fusion} dataset="abc" />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};
