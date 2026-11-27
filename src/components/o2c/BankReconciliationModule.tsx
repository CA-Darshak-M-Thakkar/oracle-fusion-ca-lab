import React from 'react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';
import { inr } from '../../data/company';

export const BankReconciliationModule: React.FC = () => {
  const { bankLines, arReceipts, reconcileBankLine } = useERP();
  return (
    <ModuleFrame
      title="Cash Management — Bank Reconciliation"
      route="bank_reconciliation"
      caConceptTitle="Last step of order-to-cash"
      caConceptBody="Match each line on the bank statement to a receipt already in the books. Matching does not post a second entry."
    >
      <div className="oracle-panel p-5 space-y-4">
        <p className="text-lg leading-snug">
          ABC Limited’s bank statement is below. The ₹10,000 from Mehta Stores is receipt RCPT-501. It is unapplied, but it is already in the cash book.
        </p>
        <table className="w-full text-left">
          <thead className="oracle-table-header">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Bank statement</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Matched to</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {bankLines.map((line) => (
              <tr key={line.id} className="border-t border-slate-600">
                <td className="p-3">{line.date}</td>
                <td className="p-3">{line.description}</td>
                <td className="p-3 text-right font-semibold">₹{inr(line.amount)}</td>
                <td className="p-3">{line.matchedReceiptId ?? 'Not matched'}</td>
                <td className="p-3">
                  {!line.matchedReceiptId && line.amount === 10000 && (
                    <button
                      type="button"
                      data-coach="match-bank"
                      className="oracle-btn-primary"
                      onClick={() => reconcileBankLine(line.id, arReceipts.find((r) => r.amount === 10000)?.id || 'RCPT-501')}
                    >
                      Match
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModuleFrame>
  );
};
