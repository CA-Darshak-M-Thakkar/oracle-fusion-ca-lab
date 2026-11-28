import React, { useEffect, useState } from 'react';
import { EbsWindow, SCREENS, THEME, DATASETS, fill } from './EbsWindow';
import { FusionView, ClickPath } from './FusionView';
import hashInfo from '../../../data/ebs/source-hash.json';

const LAB_ROUTE: Record<string, string> = { requisition_form: 'purchase_requisitions', find_requisitions: 'manage_requisitions', po_form: 'purchase_orders', receipts: 'my_receipts', invoice_workbench: 'payables_invoices', payments: 'payables_payments' };

/** Gallery: each EBS R12 screen (CSS replica) next to its Fusion Cloud counterpart. Routes: #ebs-replica, #ebs-replica/<screen-id> (1:1 single window). */
export const EbsReplicaGallery: React.FC = () => {
  const ds = 'abc';
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => { const f = () => setHash(window.location.hash); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  const parts = hash.replace(/^#/, '').split('/');
  const only = parts[1]?.split('?')[0];
  const q = new URLSearchParams(hash.split('?')[1] || '');
  const dsq = ds;
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
        <span style={{ fontSize: 14 }}>One set of dummy data everywhere: <b>ABC Ltd</b>, Sharma Traders, 10 Office Chairs × ₹5,000 = ₹50,000 + 18% GST = ₹59,000.</span>
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
              <ClickPath steps={[s.responsibility, ...(s.nav || '').split('>')].map((x: any) => String(x || '').trim()).filter(Boolean)} color="#2d84c5" label="EBS click path:" />
            </div>
            <div>
              <div style={{ background: '#c74634', color: '#fff', padding: '4px 10px', fontWeight: 600, fontSize: 14, borderRadius: '4px 4px 0 0' }}>{THEME.labels.fusion}</div>
              <FusionView spec={s.fusion} dataset={ds} />
              <ClickPath steps={(s.fusion.path || []).map((x: string) => fill(x, DATASETS[ds]))} color="#c74634" label="Fusion click path:" press={s.fusion.press} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};
