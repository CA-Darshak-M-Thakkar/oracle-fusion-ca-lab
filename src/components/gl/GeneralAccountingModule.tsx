import React, { useState } from 'react';
import { Plus, BookOpen, BarChart3 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const GeneralAccountingModule: React.FC = () => {
  const { currentRoute, navigate, glAccounts, journals, createManualJournal } = useERP();
  const [segmentFilter, setSegmentFilter] = useState('');
  const [jeDesc, setJeDesc] = useState('');
  const [debitSeg, setDebitSeg] = useState('5000');
  const [creditSeg, setCreditSeg] = useState('0001');
  const [jeAmount, setJeAmount] = useState(500);

  if (currentRoute === 'journals') {
    return (
      <ModuleFrame
        title="General Accounting — Journals"
        route="journals"
        caConceptTitle="CA Concept: Subledger Accounting (SLA) & Manual Journals"
        caConceptBody="Every AP Invoice, Payment, AR Invoice, and Receipt automatically creates balanced Debit/Credit Journal Entries in the General Ledger. Auditors also scrutinize Manual Journals for year-end window dressing."
        actions={
          <button onClick={() => navigate('detail_balances')} className="oracle-btn-secondary">
            Inquire on Detail Balances →
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 oracle-panel p-5 h-fit">
            <h3 className="text-[14px] font-semibold mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#00688C]" /> Create Manual Journal Entry
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!jeDesc.trim()) return;
                createManualJournal(jeDesc, debitSeg, creditSeg, jeAmount);
                setJeDesc('');
              }}
              className="space-y-3 text-[12.5px]"
            >
              <div>
                <label className="block font-medium mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={jeDesc}
                  onChange={(e) => setJeDesc(e.target.value)}
                  placeholder="e.g. Accrued Audit Fee"
                  className="oracle-input w-full"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Debit Account</label>
                <select value={debitSeg} onChange={(e) => setDebitSeg(e.target.value)} className="oracle-select w-full">
                  {glAccounts.map((a) => (
                    <option key={a.segment} value={a.segment}>{a.segment} — {a.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Credit Account</label>
                <select value={creditSeg} onChange={(e) => setCreditSeg(e.target.value)} className="oracle-select w-full">
                  {glAccounts.map((a) => (
                    <option key={a.segment} value={a.segment}>{a.segment} — {a.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Amount (INR)</label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={jeAmount}
                  onChange={(e) => setJeAmount(Number(e.target.value))}
                  className="oracle-input w-full"
                />
              </div>
              <button type="submit" className="oracle-btn-primary w-full justify-center">
                Post Journal to ABC India Primary Ledger
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 oracle-panel p-5">
            <h3 className="text-[14px] font-semibold mb-3" data-coach="journal-list">Posted Journals (ABC India Primary Ledger)</h3>
            <div className="space-y-3">
              {journals.map((je) => (
                <div key={je.id} className="border border-[#D6DFE6] rounded p-3.5 bg-[#FAFBFD]">
                  <div className="flex flex-wrap justify-between items-center text-[12.5px] mb-2">
                    <div>
                      <strong className="text-[#00688C]">{je.id}</strong> — {je.description}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#EFF3F7] rounded text-[11px]">{je.source}</span>
                      <span className="px-2 py-0.5 bg-green-50 text-[#2E7D32] rounded text-[11px] font-semibold">
                        {je.status}
                      </span>
                    </div>
                  </div>
                  <table className="w-full text-[12px] border-t">
                    <thead>
                      <tr className="text-[#5E6C7A]">
                        <th className="py-1 text-left">Account</th>
                        <th className="py-1 text-right">Debit</th>
                        <th className="py-1 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {je.lines.map((l, i) => (
                        <tr key={i}>
                          <td className="py-1">{l.accountSegment} — {l.accountDescription}</td>
                          <td className="py-1 text-right">{l.debit > 0 ? `₹${l.debit.toFixed(2)}` : '—'}</td>
                          <td className="py-1 text-right">{l.credit > 0 ? `₹${l.credit.toFixed(2)}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ModuleFrame>
    );
  }

  // Detail Balances / Dashboard (Page 73)
  const filtered = glAccounts.filter(
    (a) =>
      segmentFilter === '' ||
      a.segment.includes(segmentFilter) ||
      a.description.toLowerCase().includes(segmentFilter.toLowerCase())
  );

  return (
    <ModuleFrame
      title="General Accounting — Inquire on Detail Balances"
      route="detail_balances"
      caConceptTitle="CA Concept: General Ledger Detail Balances"
      caConceptBody="Shows live Beginning Balance, Period Debits, Period Credits, and Ending Balance for every GL account in US_Primary_Ledger. Any P2P or O2C transaction you post updates these numbers immediately."
      actions={
        <div className="flex gap-2">
          <button onClick={() => navigate('journals')} className="oracle-btn-secondary">
            <BookOpen className="w-3.5 h-3.5" /> Journals
          </button>
          <button onClick={() => navigate('scheduled_processes')} className="oracle-btn-primary">
            <BarChart3 className="w-3.5 h-3.5" /> Run Trial Balance Report →
          </button>
        </div>
      }
    >
      <div className="oracle-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[13px]">
            Ledger: <strong>ABC India Primary Ledger</strong> | Currency: <strong>INR</strong>
          </div>
          <input
            type="text"
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value)}
            placeholder="Filter Account Segment or Description..."
            className="oracle-input w-72"
          />
        </div>

        <div data-coach="gl-balances" className="overflow-x-auto border border-[#D6DFE6] rounded">
          <table className="w-full text-[12.5px] text-left">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2.5">Account Segment</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5 text-right">Beginning Balance</th>
                <th className="p-2.5 text-right">Debits</th>
                <th className="p-2.5 text-right">Credits</th>
                <th className="p-2.5 text-right">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5]">
              {filtered.map((acc) => {
                const ending = acc.beginningBalance + acc.debits - acc.credits;
                return (
                  <tr key={acc.segment} className="hover:bg-[#F8FAFC]">
                    <td className="p-2.5 font-mono font-semibold text-[#00688C]">{acc.segment}</td>
                    <td className="p-2.5 font-medium">{acc.description}</td>
                    <td className="p-2.5">{acc.type}</td>
                    <td className="p-2.5 text-right font-mono">{acc.beginningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-right font-mono text-[#2E7D32]">{acc.debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-right font-mono text-[#C74634]">{acc.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{ending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleFrame>
  );
};
