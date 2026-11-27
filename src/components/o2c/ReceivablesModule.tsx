import React, { useState } from 'react';
import { Receipt, CreditCard, CheckCircle2, X, ChevronDown } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const ReceivablesModule: React.FC = () => {
  const {
    currentRoute,
    selectedId,
    navigate,
    customers,
    arTransactions,
    postARTransactionToLedger,
    createCreditMemo,
    arReceipts,
    createARReceipt,
    showToast,
  } = useERP();

  const [actionsOpen, setActionsOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState(100);
  const [creditReason, setCreditReason] = useState('Damaged goods allowance');

  // Create Receipt State (Page 69)
  const [rcptCustomer, setRcptCustomer] = useState('Mehta Stores');
  const [rcptMethod, setRcptMethod] = useState('NEFT');
  const [rcptAmount, setRcptAmount] = useState(118000);
  const [applyTxId, setApplyTxId] = useState('');

  // Review Transaction (Page 68)
  if (currentRoute === 'review_ar_transaction') {
    const tx = arTransactions.find((t) => t.id === selectedId) ?? arTransactions[0];
    if (!tx) return null;

    return (
      <ModuleFrame
        title={`Review Transaction: Invoice ${tx.id}`}
        route="review_ar_transaction"
        caConceptTitle="CA Concept: Receivables Invoice & Balance Verification"
        caConceptBody="Auditors use 'Actions > View Balance Details' to verify Original Amount, Credits, Applied Receipts, and remaining Balance Due. Unexplained Credit Notes are a major O2C audit red flag!"
        actions={
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                onClick={() => setActionsOpen(!actionsOpen)}
                className="oracle-btn-primary"
              >
                Actions <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {actionsOpen && (
                <div className="absolute right-0 top-9 w-52 bg-white border border-[#D6DFE6] rounded shadow-xl z-40 py-1 text-[12.5px]">
                  <button
                    onClick={() => {
                      setBalanceModalOpen(true);
                      setActionsOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#EDF6FA] font-semibold text-[#00688C]"
                  >
                    View Balance Details
                  </button>
                  <button
                    onClick={() => {
                      setCreditModalOpen(true);
                      setActionsOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-[#EDF6FA]"
                  >
                    Credit Transaction
                  </button>
                  {!tx.postedToLedger && (
                    <button
                      onClick={() => {
                        postARTransactionToLedger(tx.id);
                        setActionsOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#EDF6FA]"
                    >
                      Post to Ledger
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setRcptCustomer(tx.customer);
                setRcptAmount(tx.balanceDue);
                setApplyTxId(tx.id);
                navigate('create_ar_receipt');
              }}
              className="oracle-btn-secondary"
            >
              Create Receipt →
            </button>
            <button onClick={() => navigate('receivables_billing')} className="oracle-btn-secondary">
              Done
            </button>
          </div>
        }
      >
        <div className="oracle-panel p-6 space-y-5 text-[12.5px]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-4">
            <div className="space-y-2">
              <div><span className="text-[#5E6C7A] w-32 inline-block">Business Unit:</span> {tx.bu}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Transaction Source:</span> {tx.transactionSource}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Transaction Number:</span> <strong>{tx.id}</strong></div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Status:</span> <span className="text-[#2E7D32] font-semibold">{tx.status}</span></div>
            </div>
            <div className="space-y-2">
              <div><span className="text-[#5E6C7A] w-32 inline-block">Bill-to Customer:</span> <strong>{tx.customer}</strong></div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Customer #:</span> {tx.customerNumber}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Transaction Date:</span> {tx.transactionDate}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Payment Terms:</span> {tx.paymentTerms}</div>
            </div>
            <div className="space-y-2 md:text-right">
              <div><span className="text-[#5E6C7A]">Original Amount:</span> <strong>₹{tx.originalAmount.toFixed(2)} {tx.currency}</strong></div>
              <div><span className="text-[#5E6C7A]">Credits:</span> ₹{tx.creditedAmount.toFixed(2)}</div>
              <div><span className="text-[#5E6C7A]">Receipts Applied:</span> ₹{tx.receiptApplied.toFixed(2)}</div>
              <div className="text-[15px] text-[#00688C] font-bold">Balance Due: ₹{tx.balanceDue.toFixed(2)} {tx.currency}</div>
            </div>
          </div>

          <table className="w-full text-[12.5px] text-left border rounded">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2.5">Line</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Unit Price</th>
                <th className="p-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {tx.lines.map((l) => (
                <tr key={l.lineNumber}>
                  <td className="p-2.5">{l.lineNumber}</td>
                  <td className="p-2.5 font-semibold">{l.itemCode}</td>
                  <td className="p-2.5">{l.description}</td>
                  <td className="p-2.5 text-right">{l.quantity}</td>
                  <td className="p-2.5 text-right">₹{l.unitPrice.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-semibold">₹{l.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* View Balance Details Modal */}
        {balanceModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-xl max-w-md w-full p-5">
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                <h4 className="font-semibold text-[14px]">Balance Details — Invoice {tx.id}</h4>
                <button onClick={() => setBalanceModalOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between"><span>Original Amount:</span><strong>₹{tx.originalAmount.toFixed(2)}</strong></div>
                <div className="flex justify-between"><span>Credit Memos:</span><span>-₹{tx.creditedAmount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Receipts Applied:</span><span>-₹{tx.receiptApplied.toFixed(2)}</span></div>
                <div className="flex justify-between border-t pt-2 text-[15px] text-[#00688C] font-bold">
                  <span>Remaining Balance Due:</span><span>₹{tx.balanceDue.toFixed(2)} {tx.currency}</span>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => setBalanceModalOpen(false)} className="oracle-btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Credit Memo Modal */}
        {creditModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-xl max-w-md w-full p-5">
              <div className="flex justify-between items-center border-b pb-2 mb-3">
                <h4 className="font-semibold text-[14px]">Credit Transaction {tx.id}</h4>
                <button onClick={() => setCreditModalOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3 text-[12.5px]">
                <div>
                  <label className="block font-medium mb-1">Credit Amount (INR)</label>
                  <input
                    type="number"
                    min={1}
                    max={tx.balanceDue}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="oracle-input w-full"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Reason (Audit Documentation)</label>
                  <input
                    type="text"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    className="oracle-input w-full"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    createCreditMemo(tx.id, creditAmount, creditReason);
                    setCreditModalOpen(false);
                  }}
                  className="oracle-btn-primary"
                >
                  Apply Credit Memo
                </button>
                <button onClick={() => setCreditModalOpen(false)} className="oracle-btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </ModuleFrame>
    );
  }

  // Create AR Receipt (Page 69)
  if (currentRoute === 'create_ar_receipt') {
    const openCustomerInvoices = arTransactions.filter(
      (t) => t.customer === rcptCustomer && t.balanceDue > 0
    );

    return (
      <ModuleFrame
        title="Create Receipt & Apply to Invoice"
        route="create_ar_receipt"
        caConceptTitle="CA Concept: Customer Cash Collection & Receipt Application"
        caConceptBody="When a customer pays, the AR clerk records a Receipt and applies it to specific open invoices. This reduces Accounts Receivable and increases Cash/Bank."
        actions={
          <button onClick={() => navigate('accounts_receivable')} className="oracle-btn-secondary">
            Cancel
          </button>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createARReceipt({
              customer: rcptCustomer,
              receiptMethod: rcptMethod,
              amount: rcptAmount,
              applyToInvoiceId: applyTxId || undefined,
            });
            navigate('accounts_receivable');
          }}
          className="oracle-panel p-6 max-w-2xl space-y-4 text-[12.5px]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">* Customer</label>
              <select
                value={rcptCustomer}
                onChange={(e) => {
                  setRcptCustomer(e.target.value);
                  const first = arTransactions.find((t) => t.customer === e.target.value && t.balanceDue > 0);
                  setApplyTxId(first?.id ?? '');
                  if (first) setRcptAmount(first.balanceDue);
                }}
                className="oracle-select w-full"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">* Receipt Method</label>
              <select value={rcptMethod} onChange={(e) => setRcptMethod(e.target.value)} className="oracle-select w-full">
                <option value="EFT / Wire">EFT / Wire</option>
                <option value="Check">Check</option>
                <option value="Lockbox">Lockbox</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">* Receipt Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                value={rcptAmount}
                onChange={(e) => setRcptAmount(Number(e.target.value))}
                required
                className="oracle-input w-full"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Apply to Open Invoice</label>
              <select value={applyTxId} onChange={(e) => setApplyTxId(e.target.value)} className="oracle-select w-full">
                <option value="">-- Leave Unapplied --</option>
                {openCustomerInvoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    Invoice {inv.id} (Due: ₹{inv.balanceDue.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="submit" className="oracle-btn-primary">
              Submit and Apply Receipt
            </button>
          </div>
        </form>
      </ModuleFrame>
    );
  }

  // Accounts Receivable Work Area (Page 69)
  if (currentRoute === 'accounts_receivable') {
    return (
      <ModuleFrame
        title="Accounts Receivable — Receipts"
        route="accounts_receivable"
        caConceptTitle="CA Concept: Accounts Receivable & Unapplied Receipts"
        caConceptBody="Tracks customer payments received. Unapplied receipts or old open balances require investigation during cash & receivables reconciliation."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              data-coach="quick-apply-receipt"
              className="oracle-btn-primary"
              onClick={() => {
                const mine = arTransactions.find((t) => t.balanceDue > 0 && t.salesOrderId);
                const target = mine || arTransactions.find((t) => t.balanceDue > 0);
                if (!target) {
                  showToast('info', 'Nothing to collect', 'There is no open invoice.');
                  return;
                }
                createARReceipt({
                  customer: target.customer,
                  receiptMethod: 'NEFT',
                  amount: target.balanceDue,
                  applyToInvoiceId: target.id,
                });
              }}
            >
              Apply receipt to my invoice
            </button>
            <button onClick={() => navigate('create_ar_receipt')} className="oracle-btn-secondary">
              <CreditCard className="w-3.5 h-3.5" /> Create Receipt
            </button>
          </div>
        }
      >
        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3">Customer Receipts</h3>
          {arReceipts.length === 0 ? (
            <div className="text-[12.5px] text-[#5E6C7A] py-6 text-center">
              No receipts recorded yet in this session. Click <strong>Create Receipt</strong> to collect payment on an open AR invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Receipt #</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Applied Invoices</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {arReceipts.map((r) => (
                  <tr key={r.id} data-coach={r.status === 'Unapplied' ? 'unapplied-receipt' : undefined}>
                    <td className="p-2.5 font-semibold text-[#00688C]">{r.id}</td>
                    <td className="p-2.5">{r.customer}</td>
                    <td className="p-2.5">{r.receiptMethod}</td>
                    <td className="p-2.5">{r.receiptDate}</td>
                    <td className="p-2.5">{r.appliedInvoiceIds.join(', ') || 'Unapplied'}</td>
                    <td className="p-2.5 text-right font-semibold">₹{r.amount.toFixed(2)}</td>
                    <td className="p-2.5 text-[#2E7D32] font-medium">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </ModuleFrame>
    );
  }

  // Default: Receivables Billing (Page 67)
  const openCount = arTransactions.filter((t) => t.balanceDue > 0).length;
  return (
    <ModuleFrame
      title="Receivables — Billing (Manage Transactions)"
      route="receivables_billing"
      caConceptTitle="CA Concept: Receivables Billing & Open Invoices"
      caConceptBody="View all customer invoices generated from Order Management or entered manually. Click any Transaction Number to inspect Balance Details or Issue a Credit Memo."
      actions={
        <button onClick={() => navigate('create_ar_receipt')} className="oracle-btn-primary">
          <Receipt className="w-3.5 h-3.5" /> Collect Customer Payment →
        </button>
      }
    >
      <div className="space-y-5" data-coach="ar-invoice-list">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="oracle-panel p-4">
            <div className="text-[12px] text-[#5E6C7A]">Open Invoices</div>
            <div className="text-[28px] font-light text-[#00688C]">{openCount}</div>
          </div>
          <div className="oracle-panel p-4">
            <div className="text-[12px] text-[#5E6C7A]">Total Receivables Due</div>
            <div className="text-[24px] font-light text-[#C74634]">
              ₹{arTransactions.reduce((s, t) => s + t.balanceDue, 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3">Transactions (Customer Invoices)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Transaction #</th>
                  <th className="p-2.5">Source</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-right">Original</th>
                  <th className="p-2.5 text-right">Balance Due</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {arTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-2.5">
                      <button
                        onClick={() => navigate('review_ar_transaction', tx.id)}
                        className="text-[#00688C] font-semibold hover:underline"
                      >
                        {tx.id}
                      </button>
                    </td>
                    <td className="p-2.5">{tx.transactionSource}</td>
                    <td className="p-2.5">{tx.customer}</td>
                    <td className="p-2.5">{tx.transactionDate}</td>
                    <td className="p-2.5 text-right">₹{tx.originalAmount.toLocaleString()}</td>
                    <td className="p-2.5 text-right font-semibold text-[#C74634]">
                      ₹{tx.balanceDue.toLocaleString()}
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-[#2E7D32] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ModuleFrame>
  );
};
