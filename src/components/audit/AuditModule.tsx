import React, { useState } from 'react';
import { ShieldAlert, Download, Search, AlertTriangle, CheckCircle2, FileSearch } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';
import { CaseStudies } from './CaseStudies';

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
          <div className="oracle-panel p-5" data-coach="audit-log">
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

  return (
    <ModuleFrame
      title="Risk Management — CA Audit Lab"
      route="ca_audit_lab"
      caConceptTitle="Cases from the AICITSS notes"
      caConceptBody="Case 9.1 and Case 9.2 are from CA Noman Merchant’s Unit 4. Company LMN is the internal-control case. Look first. The note after the step explains what you saw."
      actions={
        <button onClick={() => navigate('audit_reports')} className="oracle-btn-secondary">
          <FileSearch className="w-3.5 h-3.5" /> Open Fusion Audit Trail
        </button>
      }
    >
      <div data-coach="audit-log" className="hidden" />
      <CaseStudies />
    </ModuleFrame>
  );
};
