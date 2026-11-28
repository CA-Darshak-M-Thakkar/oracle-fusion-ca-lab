import React, { useEffect, useState } from 'react';
import { CalendarClock, Download, Printer, Plus, CheckCircle2, X, Eye } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';
import { ScheduledJob } from '../../types/erp';
import { COMPANY, daysPastDue, inr, supplierBucket, trialBalanceTotals } from '../../data/company';
import { emitGuide } from '../../guide/events';

export const ScheduledProcessesModule: React.FC = () => {
  const { scheduledJobs, scheduleNewProcess, glAccounts, apInvoices, arTransactions } = useERP();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ScheduledJob['reportType']>('TrialBalance');
  const [viewingJob, setViewingJob] = useState<ScheduledJob | null>(null);

  useEffect(() => {
    if (viewingJob?.reportType === 'TrialBalance') emitGuide('tb-viewed');
    if (viewingJob?.reportType === 'SupplierAging' || viewingJob?.reportType === 'PayablesAging') emitGuide('aging-viewed');
  }, [viewingJob]);

  const exportCSV = (filename: string, rows: string[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ModuleFrame
      title="Tools — Scheduled Processes & Financial Reports"
      route="scheduled_processes"
      caConceptTitle="CA Concept: ESS Scheduled Processes (Trial Balance & Aging Reports)"
      caConceptBody="In Oracle Fusion, reports are run via 'Schedule New Process'. Auditors generate the Trial Balance Report, Supplier Balance Aging Report (P2P), and Aging - 4 Bucket Report (O2C) from here."
      actions={
        <button onClick={() => setModalOpen(true)} className="oracle-btn-primary">
          <Plus className="w-3.5 h-3.5" /> Schedule New Process
        </button>
      }
    >
      <div className="space-y-5">
        {/* Process Queue */}
        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#00688C]" /> Search Results: Scheduled Processes
          </h3>
          <div className="overflow-x-auto border border-[#D6DFE6] rounded">
            <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Process ID</th>
                  <th className="p-2.5">Name</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Submitted By</th>
                  <th className="p-2.5">Submission Time</th>
                  <th className="p-2.5">Output</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {scheduledJobs.map((job) => (
                  <tr
                    key={job.processId}
                    className={`hover:bg-[#F8FAFC] ${
                      viewingJob?.processId === job.processId ? 'bg-[#EDF6FA]' : ''
                    }`}
                  >
                    <td className="p-2.5 font-mono font-semibold text-[#00688C]">{job.processId}</td>
                    <td className="p-2.5 font-medium">{job.name}</td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1 text-[#2E7D32] font-semibold text-[11.5px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {job.status}
                      </span>
                    </td>
                    <td className="p-2.5">{job.submittedBy}</td>
                    <td className="p-2.5">{job.submissionTime}</td>
                    <td className="p-2.5">
                      <button
                        data-coach={job.reportType === 'TrialBalance' ? 'view-trial-balance' : job.reportType === 'SupplierAging' ? 'view-supplier-aging' : undefined}
                        onClick={() => setViewingJob(job)}
                        className="text-[#00688C] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Output
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Report Output Viewer */}
        {viewingJob && (
          <div className="oracle-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 mb-4 no-print">
              <div>
                <span className="font-bold text-[#C74634] tracking-wider text-[14px]">ORACLE</span>
                <span className="ml-3 text-[15px] font-semibold">{viewingJob.name}</span>
                <span className="ml-2 text-[12px] text-[#5E6C7A]">(Process #{viewingJob.processId})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (viewingJob.reportType === 'TrialBalance') {
                      exportCSV('Trial_Balance_Report.csv', [
                        ['Account_Seg', 'Description', 'Beginning Balance (INR)', 'Debits (INR)', 'Credits (INR)', 'Ending Balance (INR)'],
                        ...glAccounts.map((a) => [
                          a.segment,
                          a.description,
                          a.beginningBalance.toFixed(2),
                          a.debits.toFixed(2),
                          a.credits.toFixed(2),
                          (a.beginningBalance + a.debits - a.credits).toFixed(2),
                        ]),
                      ]);
                    } else if (viewingJob.reportType === 'ARAging') {
                      exportCSV('AR_Aging_4_Bucket_Report.csv', [
                        ['Customer Name', 'Customer #', 'Invoice #', 'Balance Due', 'Days Past Due'],
                        ...arTransactions.map((t) => [
                          t.customer,
                          t.customerNumber,
                          t.id,
                          t.balanceDue.toFixed(2),
                          String(t.daysPastDue),
                        ]),
                      ]);
                    } else {
                      exportCSV('Supplier_Balance_Aging_Report.csv', [
                        ['Supplier', 'Invoice #', 'Invoice Amount', 'Unpaid Amount', 'Days Overdue'],
                        ...apInvoices.map((i) => [
                          i.supplier,
                          i.id,
                          i.amount.toFixed(2),
                          i.unpaidAmount.toFixed(2),
                          String(i.daysOverdue),
                        ]),
                      ]);
                    }
                  }}
                  className="oracle-btn-secondary"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel (CSV)
                </button>
                <button onClick={() => window.print()} className="oracle-btn-secondary">
                  <Printer className="w-3.5 h-3.5" /> Print PDF
                </button>
              </div>
            </div>

            {/* Trial Balance Report (Page 75) */}
            {viewingJob.reportType === 'TrialBalance' && (
              <div>
                <div className="text-[12px] text-[#5E6C7A] mb-3">
                  Ledger: <strong>{COMPANY.ledger}</strong> | Company: <strong>{COMPANY.legalEntity}</strong> | GSTIN {COMPANY.gstin}
                </div>
                {(() => {
                  const totals = trialBalanceTotals(glAccounts);
                  return (
                    <p className={`mb-3 text-lg font-semibold ${totals.balanced ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {totals.balanced
                        ? `Books balance. Debit total ₹${inr(totals.endDr)} equals credit total ₹${inr(totals.endCr)}.`
                        : `Out of balance. Debits ₹${inr(totals.endDr)} Credits ₹${inr(totals.endCr)}.`}
                    </p>
                  );
                })()}
                <table className="w-full text-[12px] border border-[#BCC6D0]">
                  <thead className="bg-[#D9E2EC]">
                    <tr>
                      <th className="p-2 border text-left">Account_Seg</th>
                      <th className="p-2 border text-left">Description</th>
                      <th className="p-2 border text-right">Beginning Balance (INR)</th>
                      <th className="p-2 border text-right">Debits (INR)</th>
                      <th className="p-2 border text-right">Credits (INR)</th>
                      <th className="p-2 border text-right">Ending Balance (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {glAccounts.map((a) => {
                      const end = a.beginningBalance + a.debits - a.credits;
                      return (
                        <tr key={a.segment} className="hover:bg-[#F8FAFC]">
                          <td className="p-2 border font-mono">{a.segment}</td>
                          <td className="p-2 border">{a.description}</td>
                          <td className="p-2 border text-right font-mono">{a.beginningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border text-right font-mono">{a.debits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border text-right font-mono">{a.credits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border text-right font-mono font-semibold">{end.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totals = trialBalanceTotals(glAccounts);
                      return (
                        <tr className="font-semibold bg-slate-100">
                          <td className="p-2 border" colSpan={2}>Totals (Dr and Cr)</td>
                          <td className="p-2 border text-right">Dr {inr(totals.openingDr)} / Cr {inr(totals.openingCr)}</td>
                          <td className="p-2 border text-right">{inr(totals.periodDr)}</td>
                          <td className="p-2 border text-right">{inr(totals.periodCr)}</td>
                          <td className="p-2 border text-right">Dr {inr(totals.endDr)} / Cr {inr(totals.endCr)}</td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            )}

            {/* Supplier Balance Aging Report (Page 51) */}
            {(viewingJob.reportType === 'SupplierAging' || viewingJob.reportType === 'PayablesAging') && (
              <div>
                <div className="text-[12px] text-[#5E6C7A] mb-3">
                  {COMPANY.legalEntity} — unpaid supplier bills. Buckets from the due date: 0–30, 30–60, 60–90, 90+ days (Unit 4, page 49).
                </div>
                <table className="w-full text-[12px] border border-[#BCC6D0]">
                  <thead className="bg-[#B8D4E8]">
                    <tr>
                      <th className="p-2 border text-left">Supplier</th>
                      <th className="p-2 border text-left">Invoice</th>
                      <th className="p-2 border text-left">Due</th>
                      <th className="p-2 border text-right">Unpaid</th>
                      <th className="p-2 border text-right">0–30</th>
                      <th className="p-2 border text-right">30–60</th>
                      <th className="p-2 border text-right">60–90</th>
                      <th className="p-2 border text-right">90+</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apInvoices
                      .filter((i) => i.unpaidAmount > 0)
                      .map((inv) => {
                        const days = daysPastDue(inv.dueDate);
                        const bucket = supplierBucket(days);
                        const cell = (name: string) => (bucket === name ? inv.unpaidAmount.toFixed(2) : '0.00');
                        return (
                          <tr key={inv.id}>
                            <td className="p-2 border font-medium">{inv.supplier}</td>
                            <td className="p-2 border">{inv.id}</td>
                            <td className="p-2 border">{inv.dueDate} ({days} days)</td>
                            <td className="p-2 border text-right font-semibold">{inv.unpaidAmount.toFixed(2)}</td>
                            <td className="p-2 border text-right">{cell('0-30')}</td>
                            <td className="p-2 border text-right">{cell('30-60')}</td>
                            <td className="p-2 border text-right">{cell('60-90')}</td>
                            <td className="p-2 border text-right">{cell('90+')}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* AR Aging - 4 Bucket Report (Page 71) */}
            {viewingJob.reportType === 'ARAging' && (
              <div>
                <div className="text-[12px] text-[#5E6C7A] mb-3">
                  {COMPANY.legalEntity} — customer dues from the due date (payment terms), not from the invoice date. Unapplied receipts are not in this list.
                </div>
                <table className="w-full text-[12px] border border-[#BCC6D0]">
                  <thead className="bg-[#D9E2EC]">
                    <tr>
                      <th className="p-2 border text-left">Customer Name</th>
                      <th className="p-2 border text-left">Customer #</th>
                      <th className="p-2 border text-right">Outstanding Amount (INR)</th>
                      <th className="p-2 border text-right">Current</th>
                      <th className="p-2 border text-right">1-30 days past</th>
                      <th className="p-2 border text-right">31-60 days past</th>
                      <th className="p-2 border text-right">61+ days past</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arTransactions
                      .filter((t) => t.balanceDue > 0)
                      .map((tx) => {
                        const days = daysPastDue(tx.dueDate);
                        return (
                        <tr key={tx.id}>
                          <td className="p-2 border font-medium">{tx.customer}</td>
                          <td className="p-2 border">{tx.customerNumber} · due {tx.dueDate}</td>
                          <td className="p-2 border text-right font-semibold">{tx.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="p-2 border text-right">{days === 0 ? tx.balanceDue.toFixed(2) : '0.00'}</td>
                          <td className="p-2 border text-right">{days >= 1 && days <= 30 ? tx.balanceDue.toFixed(2) : '0.00'}</td>
                          <td className="p-2 border text-right">{days >= 31 && days <= 60 ? tx.balanceDue.toFixed(2) : '0.00'}</td>
                          <td className="p-2 border text-right text-[#C74634] font-semibold">{days >= 61 ? tx.balanceDue.toFixed(2) : '0.00'}</td>
                        </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Schedule New Process Modal (Page 50) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-xl max-w-lg w-full p-5">
            <div className="flex justify-between items-center border-b pb-2.5 mb-4">
              <h4 className="font-semibold text-[14px]">Schedule New Process</h4>
              <button onClick={() => setModalOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4 text-[12.5px]">
              <div>
                <label className="block font-medium mb-1">Name</label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value as ScheduledJob['reportType'])}
                  className="oracle-select w-full"
                >
                  <option value="TrialBalance">Trial Balance Report</option>
                  <option value="SupplierAging">Supplier Balance Aging Report</option>
                  <option value="ARAging">Aging - 4 Bucket Report</option>
                  <option value="PayablesAging">Payables Invoice Aging Report</option>
                </select>
              </div>
              <div className="p-3 bg-[#F8FAFC] border rounded text-[12px] text-[#5E5852]">
                Parameters: Ledger = <strong>ABC India Primary Ledger</strong> | Business Unit = <strong>ABC Rajkot Business Unit</strong>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  const job = scheduleNewProcess(selectedReportType, { Ledger: 'ABC India Primary Ledger' });
                  setViewingJob(job);
                  setModalOpen(false);
                }}
                className="oracle-btn-primary"
              >
                Submit
              </button>
              <button onClick={() => setModalOpen(false)} className="oracle-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </ModuleFrame>
  );
};
