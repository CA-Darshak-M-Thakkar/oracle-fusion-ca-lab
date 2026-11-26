import React, { useState } from 'react';
import { ShieldAlert, Download, Search, AlertTriangle, CheckCircle2, FileSearch } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const AuditModule: React.FC = () => {
  const {
    currentRoute,
    navigate,
    auditLogs,
    auditEnabledObjects,
    toggleAuditObject,
    suppliers,
    apInvoices,
    apPayments,
    purchaseOrders,
    receipts,
    salesOrders,
    shipments,
    arTransactions,
    inventoryAdjustments,
  } = useERP();

  const [productFilter, setProductFilter] = useState('All');
  const [eventFilter, setEventFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('');
  const [activeCaseTab, setActiveCaseTab] = useState<'redflags' | 'case91' | 'case92'>('redflags');

  const exportAuditCSV = () => {
    const rows = [
      ['Date/Time', 'User', 'Product', 'Event Type', 'Business Object', 'Record ID', 'Description', 'Old Value', 'New Value'],
      ...auditLogs.map((l) => [
        l.timestamp,
        l.user,
        l.product,
        l.eventType,
        l.businessObject,
        l.recordId,
        l.description,
        l.oldValue ?? '',
        l.newValue ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Oracle_Fusion_Audit_Report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Audit Reports Screen (Pages 77-78)
  if (currentRoute === 'audit_reports') {
    const filteredLogs = auditLogs.filter(
      (l) =>
        (productFilter === 'All' || l.product === productFilter) &&
        (eventFilter === 'All' || l.eventType === eventFilter) &&
        (userFilter === '' || l.user.toLowerCase().includes(userFilter.toLowerCase()))
    );

    return (
      <ModuleFrame
        title="Tools — Audit Reports (Fusion Audit Trail)"
        route="audit_reports"
        caConceptTitle="CA Concept: Fusion Audit & Companies Act, 2013 (Audit Trail Rule)"
        caConceptBody="Every Create (Insert), Update, and Delete action in Oracle Fusion is captured with Timestamp, User, Business Object, Old Value, and New Value — fulfilling statutory Audit Trail requirements under the Companies Act, 2013."
        actions={
          <div className="flex gap-2">
            <button onClick={exportAuditCSV} className="oracle-btn-primary">
              <Download className="w-3.5 h-3.5" /> Export to Excel (CSV)
            </button>
            <button onClick={() => navigate('ca_audit_lab')} className="oracle-btn-secondary">
              CA Audit Lab & Red Flags →
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Search Filters (Page 78) */}
          <div className="oracle-panel p-4">
            <h3 className="text-[13.5px] font-semibold mb-3 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-[#00688C]" /> Search Audit History
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[12.5px]">
              <div>
                <label className="block text-[11px] text-[#5E6C7A] mb-1">Product</label>
                <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="oracle-select w-full">
                  <option value="All">All Products</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Payables">Payables</option>
                  <option value="Order Management">Order Management</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Receivables">Receivables</option>
                  <option value="General Accounting">General Accounting</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#5E6C7A] mb-1">Event Type</label>
                <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="oracle-select w-full">
                  <option value="All">All (Insert, Update, Delete)</option>
                  <option value="Object Data Insert">Object Data Insert</option>
                  <option value="Object Data Update">Object Data Update</option>
                  <option value="Object Data Delete">Object Data Delete</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#5E6C7A] mb-1">User</label>
                <input
                  type="text"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  placeholder="e.g. Sindhu Konduru"
                  className="oracle-input w-full"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setProductFilter('All');
                    setEventFilter('All');
                    setUserFilter('');
                  }}
                  className="oracle-btn-secondary"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Audit Results Table */}
          <div className="oracle-panel p-5">
            <h3 className="text-[14px] font-semibold mb-3">Search Results ({filteredLogs.length} events)</h3>
            <div className="overflow-x-auto border border-[#D6DFE6] rounded">
              <table className="w-full text-[12px] text-left">
                <thead className="oracle-table-header">
                  <tr>
                    <th className="p-2.5">Date / Time</th>
                    <th className="p-2.5">User</th>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5">Event Type</th>
                    <th className="p-2.5">Business Object</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Old → New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-[#F8FAFC]">
                      <td className="p-2.5 font-mono text-[11px] whitespace-nowrap">{l.timestamp}</td>
                      <td className="p-2.5 font-medium">{l.user}</td>
                      <td className="p-2.5">{l.product}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                            l.eventType === 'Object Data Delete'
                              ? 'bg-red-50 text-[#C74634]'
                              : l.eventType === 'Object Data Update'
                              ? 'bg-amber-50 text-[#D97706]'
                              : 'bg-green-50 text-[#2E7D32]'
                          }`}
                        >
                          {l.eventType}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono text-[11px]">{l.businessObject}</td>
                      <td className="p-2.5">{l.description}</td>
                      <td className="p-2.5 font-mono text-[11px] text-[#5E5852]">
                        {l.oldValue ? `${l.oldValue} → ` : ''}
                        {l.newValue ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Policy Configuration */}
          <div className="oracle-panel p-5">
            <h3 className="text-[14px] font-semibold mb-2">Manage Audit Policies (Business Objects Monitored)</h3>
            <p className="text-[12px] text-[#5E6C7A] mb-3">
              Toggle which Oracle Fusion business objects are actively tracked in the Audit Trail:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(auditEnabledObjects).map(([obj, enabled]) => (
                <button
                  key={obj}
                  onClick={() => toggleAuditObject(obj)}
                  className={`px-3 py-1.5 rounded text-[12px] border flex items-center gap-1.5 ${
                    enabled ? 'bg-[#EDF6FA] border-[#00688C] text-[#00688C] font-medium' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {obj}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ModuleFrame>
    );
  }

  // CA Audit Lab & Case Studies (Pages 20, 56, 80-83)
  const unauthSuppliers = suppliers.filter((s) => !s.authorized).map((s) => s.name);
  const redFlagInvoices = apInvoices.filter(
    (i) => i.matchStatus !== 'Matched (3-Way)' || unauthSuppliers.includes(i.supplier)
  );
  const creditHoldOrders = salesOrders.filter((s) => s.status === 'On Hold');
  const overdueReceivables = arTransactions.filter((t) => t.daysPastDue > 30 && t.balanceDue > 0);
  const unauthAdjustments = inventoryAdjustments.filter((a) => !a.hasDocumentation);

  return (
    <ModuleFrame
      title="Risk Management — CA Audit Lab & AICITSS Case Studies"
      route="ca_audit_lab"
      caConceptTitle="CA Concept: Auditing Financial Business Processes in Oracle Fusion"
      caConceptBody="Practice real CA audit procedures! Inspect automated Red Flags across P2P & O2C, and solve Case Study 9.1 (ABC Ltd. Inventory Discrepancy) and Case Study 9.2 (ABC Electronics Cash Flow Delay)."
      actions={
        <button onClick={() => navigate('audit_reports')} className="oracle-btn-secondary">
          <FileSearch className="w-3.5 h-3.5" /> Open Fusion Audit Trail
        </button>
      }
    >
      <div className="space-y-5">
        {/* Sub-tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCaseTab('redflags')}
            className={`px-4 py-2 rounded text-[13px] font-medium ${
              activeCaseTab === 'redflags' ? 'bg-[#C74634] text-white' : 'bg-white border border-[#D6DFE6]'
            }`}
          >
            Live P2P & O2C Red Flags ({redFlagInvoices.length + creditHoldOrders.length + unauthAdjustments.length + overdueReceivables.length})
          </button>
          <button
            onClick={() => setActiveCaseTab('case91')}
            className={`px-4 py-2 rounded text-[13px] font-medium ${
              activeCaseTab === 'case91' ? 'bg-[#00688C] text-white' : 'bg-white border border-[#D6DFE6]'
            }`}
          >
            Case Study 9.1: ABC Ltd. (P2P & Inventory)
          </button>
          <button
            onClick={() => setActiveCaseTab('case92')}
            className={`px-4 py-2 rounded text-[13px] font-medium ${
              activeCaseTab === 'case92' ? 'bg-[#00688C] text-white' : 'bg-white border border-[#D6DFE6]'
            }`}
          >
            Case Study 9.2: ABC Electronics (O2C Cash Flow)
          </button>
        </div>

        {activeCaseTab === 'redflags' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="oracle-panel p-5">
              <h3 className="text-[14px] font-semibold text-[#C74634] flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4" /> P2P Audit Red Flags Detected
              </h3>
              <div className="space-y-3 text-[12.5px]">
                {redFlagInvoices.map((inv) => (
                  <div key={inv.id} className="p-3 bg-red-50/70 border border-red-200 rounded">
                    <div className="font-semibold text-[#C74634]">
                      Invoice {inv.id} — {inv.supplier} (₹{inv.amount.toFixed(2)})
                    </div>
                    <div className="text-[#524C46] mt-0.5">
                      Issue: <strong>{inv.matchStatus}</strong>
                      {unauthSuppliers.includes(inv.supplier) && ' • Unauthorized Supplier!'}
                    </div>
                  </div>
                ))}
                {unauthAdjustments.map((adj) => (
                  <div key={adj.id} className="p-3 bg-amber-50 border border-amber-200 rounded">
                    <div className="font-semibold text-amber-900">
                      Inventory Adjustment {adj.id} ({adj.itemCode}: {adj.adjustmentQty} units)
                    </div>
                    <div className="text-amber-800 mt-0.5">
                      Issue: Missing manager authorization & supporting documentation!
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="oracle-panel p-5">
              <h3 className="text-[14px] font-semibold text-[#D97706] flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> O2C & SoD Audit Red Flags Detected
              </h3>
              <div className="space-y-3 text-[12.5px]">
                {creditHoldOrders.map((so) => (
                  <div key={so.id} className="p-3 bg-amber-50 border border-amber-200 rounded">
                    <div className="font-semibold text-amber-900">
                      Sales Order {so.id} — {so.customer} (₹{so.totalAmount.toLocaleString()})
                    </div>
                    <div className="text-amber-800 mt-0.5">
                      Issue: Order placed <strong>On Hold</strong> due to Customer Credit Limit breach.
                    </div>
                  </div>
                ))}
                {overdueReceivables.map((tx) => (
                  <div key={tx.id} className="p-3 bg-red-50/70 border border-red-200 rounded">
                    <div className="font-semibold text-[#C74634]">
                      AR Invoice {tx.id} — {tx.customer} (₹{tx.balanceDue.toLocaleString()})
                    </div>
                    <div className="text-[#524C46] mt-0.5">
                      Issue: Overdue by <strong>{tx.daysPastDue} days</strong> — High credit/collection risk.
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-[#EDF6FA] border border-[#83BFE5] rounded">
                  <div className="font-semibold text-[#00688C]">Segregation of Duties (SoD) Check</div>
                  <div className="text-[#1D3549] mt-0.5">
                    Auditor Note: Verify whether <strong>Sindhu Konduru</strong> both created Requisitions/Invoices AND approved Payments ({apPayments.length} payment(s) on record).
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCaseTab === 'case91' && (
          <div className="oracle-panel p-6 space-y-5">
            <div className="bg-[#EDF6FA] p-4 rounded border border-[#83BFE5] text-[12.5px]">
              <strong className="text-[#00688C]">Case Scenario (AICITSS Unit 4 — Page 80):</strong> ABC Ltd. identified significant discrepancies between physical inventory count and system-recorded inventory levels. Use the 4 Oracle Inquiry tools below to pinpoint the root causes!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px]">
              <div className="border rounded p-4">
                <h4 className="font-semibold text-[#00688C] mb-2">1. Purchase Order Inquiry</h4>
                {purchaseOrders.map((po) => (
                  <div key={po.id} className="py-1.5 border-b last:border-0">
                    <strong>PO {po.id}</strong> ({po.supplier}): Ordered <strong>{po.lines[0]?.quantity}</strong>, Received <strong>{po.lines[0]?.receivedQty}</strong>
                    {po.lines[0]?.quantity !== po.lines[0]?.receivedQty && (
                      <span className="ml-2 text-[#C74634] font-semibold">⚠ Short Receipt!</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="border rounded p-4">
                <h4 className="font-semibold text-[#00688C] mb-2">2. Receiving Transactions Inquiry</h4>
                {receipts.map((r) => (
                  <div key={r.id} className="py-1.5 border-b last:border-0">
                    <strong>GRN {r.id}</strong> (PO {r.poId}): Received {r.lines[0]?.quantityReceived} {r.lines[0]?.uom} on {r.transactionDate}
                  </div>
                ))}
              </div>

              <div className="border rounded p-4">
                <h4 className="font-semibold text-[#00688C] mb-2">3. Inventory Adjustment History</h4>
                {inventoryAdjustments.map((a) => (
                  <div key={a.id} className="py-1.5 border-b last:border-0">
                    <strong>{a.id}</strong> ({a.itemCode}): {a.adjustmentQty} units — <em>{a.reason}</em>
                    {!a.hasDocumentation && <span className="ml-2 text-[#C74634] font-semibold">⚠ Unverified!</span>}
                  </div>
                ))}
              </div>

              <div className="border rounded p-4">
                <h4 className="font-semibold text-[#00688C] mb-2">4. CA Audit Conclusion</h4>
                <p className="text-[#524C46]">
                  Root Causes Found: (1) PO 10 billed 50 EKG on Invoice APEX-889 when only 35 EKG were received on GRN 101; (2) Unapproved write-off ADJ-401 removed 15 EKG of NYLON THREAD without documentation.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeCaseTab === 'case92' && (
          <div className="oracle-panel p-6 space-y-5">
            <div className="bg-[#EDF6FA] p-4 rounded border border-[#83BFE5] text-[12.5px]">
              <strong className="text-[#00688C]">Case Scenario (AICITSS Unit 4 — Page 82):</strong> ABC Electronics has growing sales but severe cash flow delays. Use the 4 O2C Audit checks below to diagnose collection bottlenecks!
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px]">
              <div className="border rounded p-4">
                <h4 className="font-semibold text-[#00688C] mb-2">1. Review Sales Orders & Credit Limits</h4>
                {salesOrders.map((so) => (
                  <div key={so.id} className="py-1.5 border-b last:border-0">
                    <strong>{so.id}</strong> — {so.customer}: ₹{so.totalAmount.toLocaleString()} ({so.status})
                  </div>
                ))}
              </div>

              <div className="border rounded p-4">
                <h4 className="font-semibold text-[#00688C] mb-2">2. Utilize AR Aging Reports (Overdue &gt; 30 Days)</h4>
                {overdueReceivables.map((tx) => (
                  <div key={tx.id} className="py-1.5 border-b last:border-0">
                    <strong>Inv {tx.id}</strong> — {tx.customer}: <strong>₹{tx.balanceDue.toLocaleString()}</strong> ({tx.daysPastDue} days overdue)
                  </div>
                ))}
              </div>

              <div className="border rounded p-4">
                <h4 className="font-semibold text-[#00688C] mb-2">3. Analyze Invoicing Process &amp; Terms</h4>
                {arTransactions.slice(0, 4).map((tx) => (
                  <div key={tx.id} className="py-1.5 border-b last:border-0">
                    <strong>Inv {tx.id}</strong> — Terms: <strong>{tx.paymentTerms}</strong>, Original: ₹{tx.originalAmount.toLocaleString()}, Due: ₹{tx.balanceDue.toLocaleString()}
                  </div>
                ))}
              </div>

              <div className="border rounded p-4">
                <h4 className="font-semibold text-[#00688C] mb-2">4. Examine Shipping Documents &amp; CA Conclusion</h4>
                {shipments.map((s) => (
                  <div key={s.id} className="py-1.5 border-b">
                    <strong>Shipment {s.id}</strong> ({s.salesOrderId}): {s.shippingMethod} — Status: <strong>{s.status}</strong>
                  </div>
                ))}
                <p className="text-[#524C46] mt-2">
                  Root Causes Found: High overdue balances (&gt;30 days) for A T &amp; T SOLUTIONS INC and Imaging Innovations, Inc., plus SO-1002 blocked on Credit Hold. Recommend stricter dunning &amp; credit limit enforcement.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleFrame>
  );
};
