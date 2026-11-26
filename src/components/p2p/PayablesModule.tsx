import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertTriangle, Search, CreditCard, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const PayablesModule: React.FC = () => {
  const {
    currentRoute,
    navigate,
    suppliers,
    purchaseOrders,
    apInvoices,
    createAPInvoice,
    validateAPInvoice,
    postAPInvoiceToLedger,
    apPayments,
    createAPPayment,
  } = useERP();

  // Create AP Invoice State
  const [invSupplier, setInvSupplier] = useState('MURALI TECHNOLOGIES');
  const [invPoId, setInvPoId] = useState('11');
  const [invAmount, setInvAmount] = useState(1000);
  const [invDueDate, setInvDueDate] = useState('2026-12-22');
  const [invDesc, setInvDesc] = useState('Matched vendor invoice');

  // Create Payment State (Pages 47-48)
  const [paySupplier, setPaySupplier] = useState('MURALI TECHNOLOGIES');
  const [disbBank, setDisbBank] = useState('ORCS_ORG_A/C');
  const [payMethod, setPayMethod] = useState('10_CHECK');
  const [payProfile, setPayProfile] = useState('001_HCL_PPR US PAYMENT SYSTEM');
  const [selectInvModalOpen, setSelectInvModalOpen] = useState(false);
  const [invSearchQuery, setInvSearchQuery] = useState('');
  const [selectedPayInvIds, setSelectedPayInvIds] = useState<string[]>([]);

  // Sub-view: Create AP Invoice
  if (currentRoute === 'create_ap_invoice') {
    return (
      <ModuleFrame
        title="Create Payable Invoice (with PO Matching)"
        route="create_ap_invoice"
        caConceptTitle="CA Concept: 3-Way Matching in Accounts Payable"
        caConceptBody="Before paying a vendor, Oracle Fusion performs a 3-Way Match: Purchase Order (what we ordered) + Goods Receipt (what we received) + Vendor Invoice (what they billed). Any mismatch triggers a hold!"
        actions={
          <button onClick={() => navigate('payables_invoices')} className="oracle-btn-secondary">
            Cancel
          </button>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAPInvoice({
              supplier: invSupplier,
              poId: invPoId || undefined,
              amount: invAmount,
              description: invDesc,
              dueDate: invDueDate,
            });
            navigate('payables_invoices');
          }}
          className="oracle-panel p-6 max-w-3xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px]">
            <div>
              <label className="block font-medium mb-1">Business Unit</label>
              <input readOnly value="US1 Business Unit" className="w-full oracle-input bg-[#F4F6F9]" />
            </div>
            <div>
              <label className="block font-medium mb-1">* Identifying PO (for 3-Way Match)</label>
              <select
                value={invPoId}
                onChange={(e) => {
                  const po = purchaseOrders.find((p) => p.id === e.target.value);
                  setInvPoId(e.target.value);
                  if (po) {
                    setInvSupplier(po.supplier);
                    setInvAmount(po.totalAmount);
                    setInvDesc(`Invoice for PO ${po.id} — ${po.description}`);
                  }
                }}
                className="w-full oracle-select"
              >
                <option value="">-- No PO (Unmatched Invoice) --</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    PO {po.id} — {po.supplier} (₹{po.totalAmount})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">* Supplier</label>
              <select value={invSupplier} onChange={(e) => setInvSupplier(e.target.value)} className="w-full oracle-select">
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">* Amount (INR)</label>
              <input
                type="number"
                step="0.01"
                value={invAmount}
                onChange={(e) => setInvAmount(Number(e.target.value))}
                required
                className="w-full oracle-input"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Due Date</label>
              <input
                type="date"
                value={invDueDate}
                onChange={(e) => setInvDueDate(e.target.value)}
                className="w-full oracle-input"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Description</label>
              <input
                type="text"
                value={invDesc}
                onChange={(e) => setInvDesc(e.target.value)}
                className="w-full oracle-input"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button type="submit" className="oracle-btn-primary">
              Save & Run 3-Way Match
            </button>
          </div>
        </form>
      </ModuleFrame>
    );
  }

  // Sub-view: Create Payment (Pages 47-48)
  if (currentRoute === 'create_ap_payment') {
    const sup = suppliers.find((s) => s.name === paySupplier) ?? suppliers[0];
    const availableInvoices = apInvoices.filter(
      (i) =>
        i.unpaidAmount > 0 &&
        i.supplier === paySupplier &&
        (invSearchQuery === '' || i.id.toLowerCase().includes(invSearchQuery.toLowerCase()))
    );
    const chosenInvoices = apInvoices.filter((i) => selectedPayInvIds.includes(i.id));

    return (
      <ModuleFrame
        title="Create Payment"
        route="create_ap_payment"
        caConceptTitle="CA Concept: Supplier Payment & Bank Disbursement"
        caConceptBody="In Oracle Payables, you select the Disbursement Bank Account, Payment Method (Check/EFT), and attach Validated Invoices to pay. Saving posts Dr Accounts Payable Liability / Cr Cash/Bank."
        actions={
          <div className="flex gap-2">
            <button
              disabled={chosenInvoices.length === 0}
              onClick={() => {
                createAPPayment({
                  supplier: paySupplier,
                  disbursementBank: disbBank,
                  paymentMethod: payMethod,
                  paymentProcessProfile: payProfile,
                  invoiceIds: selectedPayInvIds,
                });
                setSelectedPayInvIds([]);
                navigate('payables_payments');
              }}
              className="oracle-btn-primary"
            >
              Save and Close
            </button>
            <button onClick={() => navigate('payables_payments')} className="oracle-btn-secondary">
              Cancel
            </button>
          </div>
        }
      >
        <div className="oracle-panel p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[12.5px]">
            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">* Business Unit</label>
                <input readOnly value="US1 Business Unit" className="col-span-2 oracle-input bg-[#F4F6F9]" />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">* Supplier or Party</label>
                <select
                  value={paySupplier}
                  onChange={(e) => {
                    setPaySupplier(e.target.value);
                    setSelectedPayInvIds([]);
                  }}
                  className="col-span-2 oracle-select"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">Supplier Site</label>
                <input readOnly value={sup.site} className="col-span-2 oracle-input bg-[#F4F6F9]" />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">Address</label>
                <input readOnly value={sup.address} className="col-span-2 oracle-input bg-[#F4F6F9]" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">* Disbursement Bank</label>
                <select value={disbBank} onChange={(e) => setDisbBank(e.target.value)} className="col-span-2 oracle-select">
                  <option value="ORCS_ORG_A/C">ORCS_ORG_A/C</option>
                  <option value="BOFA_MAIN_INR">BOFA_MAIN_INR</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">* Payment Method</label>
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="col-span-2 oracle-select">
                  <option value="10_CHECK">10_CHECK</option>
                  <option value="EFT">Electronic Funds Transfer (EFT)</option>
                  <option value="WIRE">Wire Transfer</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">* Payment Profile</label>
                <select value={payProfile} onChange={(e) => setPayProfile(e.target.value)} className="col-span-2 oracle-select">
                  <option value="001_HCL_PPR US PAYMENT SYSTEM">001_HCL_PPR US PAYMENT SYSTEM</option>
                  <option value="US_ACH_STANDARD">US_ACH_STANDARD</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">Remit-to Bank</label>
                <input readOnly value={`${sup.bankName} (${sup.bankAccount})`} className="col-span-2 oracle-input bg-[#F4F6F9]" />
              </div>
            </div>
          </div>

          {/* Invoices to Pay */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[13.5px] font-semibold">Invoices to Pay</h4>
              <button onClick={() => setSelectInvModalOpen(true)} className="oracle-btn-primary">
                <Plus className="w-3.5 h-3.5" /> Select and Add Invoices
              </button>
            </div>
            <div className="overflow-x-auto border border-[#D6DFE6] rounded">
              <table className="w-full text-[12.5px] text-left">
                <thead className="oracle-table-header">
                  <tr>
                    <th className="p-2.5">Invoice Number</th>
                    <th className="p-2.5">Due Date</th>
                    <th className="p-2.5 text-right">Unpaid Amount</th>
                    <th className="p-2.5 text-right">Payment Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F5]">
                  {chosenInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-[#5E6C7A]">
                        No invoices selected. Click "Select and Add Invoices" above.
                      </td>
                    </tr>
                  ) : (
                    chosenInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="p-2.5 font-semibold text-[#00688C]">{inv.id}</td>
                        <td className="p-2.5">{inv.dueDate}</td>
                        <td className="p-2.5 text-right">₹{inv.unpaidAmount.toFixed(2)}</td>
                        <td className="p-2.5 text-right font-semibold">₹{inv.unpaidAmount.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Select and Add Modal (Page 48) */}
        {selectInvModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-xl max-w-2xl w-full p-5">
              <div className="flex justify-between items-center border-b pb-2.5 mb-4">
                <h4 className="font-semibold text-[14px]">Select and Add: Invoices to Pay</h4>
                <button onClick={() => setSelectInvModalOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={invSearchQuery}
                  onChange={(e) => setInvSearchQuery(e.target.value)}
                  placeholder="Search Invoice Number (e.g. Inv0011)"
                  className="oracle-input flex-1"
                />
                <button className="oracle-btn-secondary"><Search className="w-3.5 h-3.5" /> Search</button>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded">
                <table className="w-full text-[12.5px] text-left">
                  <thead className="oracle-table-header">
                    <tr>
                      <th className="p-2">Select</th>
                      <th className="p-2">Number</th>
                      <th className="p-2">Due Date</th>
                      <th className="p-2 text-right">Unpaid Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {availableInvoices.map((inv) => {
                      const checked = selectedPayInvIds.includes(inv.id);
                      return (
                        <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                setSelectedPayInvIds((prev) =>
                                  checked ? prev.filter((x) => x !== inv.id) : [...prev, inv.id]
                                )
                              }
                            />
                          </td>
                          <td className="p-2 font-semibold">{inv.id}</td>
                          <td className="p-2">{inv.dueDate}</td>
                          <td className="p-2 text-right">₹{inv.unpaidAmount.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setSelectInvModalOpen(false)} className="oracle-btn-primary">
                  Apply & OK
                </button>
              </div>
            </div>
          </div>
        )}
      </ModuleFrame>
    );
  }

  // Sub-view: Payments List
  if (currentRoute === 'payables_payments') {
    return (
      <ModuleFrame
        title="Payables — Payments"
        route="payables_payments"
        caConceptTitle="CA Concept: Payments & Disbursements"
        caConceptBody="Lists all supplier payments issued. Auditors verify that every payment corresponds to a validated, 3-way matched invoice and an authorized supplier."
        actions={
          <button onClick={() => navigate('create_ap_payment')} className="oracle-btn-primary">
            <CreditCard className="w-3.5 h-3.5" /> Create Payment
          </button>
        }
      >
        <div className="oracle-panel p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Payment #</th>
                  <th className="p-2.5">Supplier</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Invoices Paid</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F5]">
                {apPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-2.5 font-semibold text-[#00688C]">{p.id}</td>
                    <td className="p-2.5">{p.supplier}</td>
                    <td className="p-2.5">{p.paymentDate}</td>
                    <td className="p-2.5">{p.paymentMethod}</td>
                    <td className="p-2.5">{p.invoiceIds.join(', ')}</td>
                    <td className="p-2.5 text-right font-semibold">₹{p.amount.toFixed(2)} {p.currency}</td>
                    <td className="p-2.5 text-[#2E7D32] font-medium">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ModuleFrame>
    );
  }

  // Default: Payables Invoices
  return (
    <ModuleFrame
      title="Payables — Invoices"
      route="payables_invoices"
      caConceptTitle="CA Concept: Accounts Payable Invoices & 3-Way Match"
      caConceptBody="Inspect all supplier invoices. Notice how Oracle Fusion flags 'Qty Variance' or 'Unmatched (No PO)' — these are key Red Flags for CA Auditors!"
      actions={
        <div className="flex gap-2">
          <button onClick={() => navigate('create_ap_invoice')} className="oracle-btn-primary">
            <Plus className="w-3.5 h-3.5" /> Create Invoice
          </button>
          <button onClick={() => navigate('create_ap_payment')} className="oracle-btn-secondary">
            Pay Invoices →
          </button>
        </div>
      }
    >
      <div className="oracle-panel p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] text-left">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2.5">Invoice #</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">PO #</th>
                <th className="p-2.5">3-Way Match Status</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5 text-right">Unpaid</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5]">
              {apInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                  <td className="p-2.5 font-semibold text-[#00688C]">{inv.id}</td>
                  <td className="p-2.5">{inv.supplier}</td>
                  <td className="p-2.5">{inv.poId ? `PO ${inv.poId}` : '—'}</td>
                  <td className="p-2.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded ${
                        inv.matchStatus === 'Matched (3-Way)'
                          ? 'bg-green-50 text-[#2E7D32]'
                          : 'bg-red-50 text-[#C74634]'
                      }`}
                    >
                      {inv.matchStatus === 'Matched (3-Way)' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      {inv.matchStatus}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">₹{inv.amount.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-semibold">₹{inv.unpaidAmount.toFixed(2)}</td>
                  <td className="p-2.5">{inv.status}</td>
                  <td className="p-2.5 flex gap-2">
                    {inv.status === 'Needs Revalidation' && (
                      <button
                        onClick={() => validateAPInvoice(inv.id)}
                        className="text-[#00688C] hover:underline text-[12px]"
                      >
                        Validate
                      </button>
                    )}
                    {!inv.postedToLedger && (
                      <button
                        onClick={() => postAPInvoiceToLedger(inv.id)}
                        className="text-[#2E7D32] hover:underline text-[12px]"
                      >
                        Post to Ledger
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleFrame>
  );
};
