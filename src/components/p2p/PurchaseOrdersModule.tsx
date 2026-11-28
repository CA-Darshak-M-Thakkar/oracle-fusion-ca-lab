import React, { useState } from 'react';
import { Search, Plus, CheckCircle2, Printer, X, FileText } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const PurchaseOrdersModule: React.FC = () => {
  const {
    currentRoute,
    selectedId,
    navigate,
    requisitions,
    purchaseOrders,
    suppliers,
    createPOFromRequisition,
    updatePO,
    submitPO,
    approvePO,
  } = useERP();

  const [reqSearch, setReqSearch] = useState('');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [docBuilderOpen, setDocBuilderOpen] = useState(false);
  const [docBuilderSupplier, setDocBuilderSupplier] = useState('Sharma Traders');
  const [stagedReqId, setStagedReqId] = useState<string | null>(null);
  const [pdfModalPO, setPdfModalPO] = useState<string | null>(null);

  // Sub-view: Process Requisitions (Pages 31-33)
  if (currentRoute === 'process_requisitions') {
    const approvedReqs = requisitions.filter(
      (r) =>
        r.status === 'Approved' &&
        (reqSearch === '' || r.id.toLowerCase().includes(reqSearch.toLowerCase()))
    );
    const stagedReq = requisitions.find((r) => r.id === stagedReqId);

    return (
      <ModuleFrame
        title="Process Requisitions"
        route="process_requisitions"
        caConceptTitle="CA Concept: Converting Approved Requisitions to Purchase Orders"
        caConceptBody="Only Approved requisitions appear here. The Buyer selects a requisition line, adds it to the Document Builder, assigns an authorized Supplier, and creates a legally binding Purchase Order."
        actions={
          <button onClick={() => navigate('manage_orders')} className="oracle-btn-secondary">
            Manage Orders
          </button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-4">
            {/* Search Box */}
            <div className="oracle-panel p-4">
              <div className="text-[13px] font-semibold mb-3">Search Requisition Lines</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block text-[11.5px] text-[#5E6C7A] mb-1">Requisitioning BU</label>
                  <select className="w-full oracle-select">
                    <option>ABC Rajkot Business Unit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] text-[#5E6C7A] mb-1">Requisition</label>
                  <input
                    type="text"
                    value={reqSearch}
                    onChange={(e) => setReqSearch(e.target.value)}
                    placeholder="e.g. NR00027"
                    className="w-full oracle-input"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setReqSearch(reqSearch)} className="oracle-btn-primary">
                    <Search className="w-3.5 h-3.5" /> Search
                  </button>
                  <button onClick={() => setReqSearch('')} className="oracle-btn-secondary">
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="oracle-panel p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13.5px] font-semibold">Search Results: Approved Requisition Lines</span>
                <button
                  onClick={() => {
                    const chosenId =
                      selectedReqId ||
                      approvedReqs.find((r) => r.lines.some((l) => l.description === 'Office Chair'))?.id ||
                      approvedReqs[0]?.id;
                    if (!chosenId) return;
                    setSelectedReqId(chosenId);
                    const req = requisitions.find((r) => r.id === chosenId);
                    if (req?.lines[0]?.supplierName) {
                      setDocBuilderSupplier(req.lines[0].supplierName);
                    }
                    setDocBuilderOpen(true);
                  }}
                  data-coach="add-to-document-builder"
                  className="oracle-btn-primary"
                >
                  Add to Document Builder
                </button>
              </div>
              <div className="overflow-x-auto border border-[#D6DFE6] rounded">
                <table className="w-full text-[12.5px] text-left">
                  <thead className="oracle-table-header">
                    <tr>
                      <th className="p-2.5">Select</th>
                      <th className="p-2.5">Requisition</th>
                      <th className="p-2.5">Line Description</th>
                      <th className="p-2.5">Requester</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF2F5]">
                    {approvedReqs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-[#5E6C7A]">
                          No approved requisitions waiting for PO creation. Create & submit a requisition first!
                        </td>
                      </tr>
                    ) : (
                      approvedReqs.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedReqId(r.id)}
                          className={`cursor-pointer ${
                            selectedReqId === r.id ? 'bg-[#EDF6FA]' : 'hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <td className="p-2.5">
                            <input
                              type="radio"
                              checked={selectedReqId === r.id}
                              onChange={() => setSelectedReqId(r.id)}
                            />
                          </td>
                          <td className="p-2.5 font-semibold text-[#00688C]">{r.id}</td>
                          <td className="p-2.5">{r.description}</td>
                          <td className="p-2.5">{r.requester}</td>
                          <td className="p-2.5 text-right font-medium">₹{r.totalAmount.toFixed(2)} {r.currency}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel: Document Builder */}
          <div className="lg:col-span-4 oracle-panel p-4 h-fit">
            <h4 className="text-[14px] font-semibold border-b pb-2 mb-3">Document Builder</h4>
            {!stagedReq ? (
              <p className="text-[12px] text-[#5E6C7A]">
                Your Document Builder is empty. Select a Requisition line and click <strong>Add to Document Builder</strong>.
              </p>
            ) : (
              <div className="space-y-3 text-[12.5px]">
                <div><span className="text-[#5E6C7A]">Procurement BU:</span> <strong>ABC Rajkot Business Unit</strong></div>
                <div><span className="text-[#5E6C7A]">Type:</span> New Order (Purchase Order)</div>
                <div><span className="text-[#5E6C7A]">Supplier:</span> <strong>{docBuilderSupplier}</strong></div>
                <div className="p-2.5 bg-[#F8FAFC] border rounded">
                  <div className="font-medium">{stagedReq.description}</div>
                  <div className="text-[#00688C] font-semibold mt-1">
                    Total: ₹{stagedReq.totalAmount.toFixed(2)} {stagedReq.currency}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      const po = createPOFromRequisition(stagedReq.id, docBuilderSupplier);
                      if (po) {
                        setStagedReqId(null);
                        navigate('edit_po', po.id);
                      }
                    }}
                    data-coach="create-po"
                    className="oracle-btn-primary flex-1 justify-center"
                  >
                    Create
                  </button>
                  <button onClick={() => setStagedReqId(null)} className="oracle-btn-secondary">
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add to Document Builder Modal (Page 32) */}
        {docBuilderOpen && selectedReqId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-xl max-w-lg w-full p-5">
              <div className="flex justify-between items-center border-b pb-2.5 mb-4">
                <h4 className="font-semibold text-[14px]">Add to Document Builder</h4>
                <button onClick={() => setDocBuilderOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3 text-[12.5px]">
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-right text-[#524C46]">Type</label>
                  <input readOnly value="New Order" className="col-span-2 oracle-input bg-[#F4F6F9]" />
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-right text-[#524C46]">Style</label>
                  <input readOnly value="Purchase Order" className="col-span-2 oracle-input bg-[#F4F6F9]" />
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <label className="text-right text-[#524C46]">Supplier</label>
                  <select
                    value={docBuilderSupplier}
                    onChange={(e) => setDocBuilderSupplier(e.target.value)}
                    className="col-span-2 oracle-select"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} {!s.authorized ? '(Unverified)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setStagedReqId(selectedReqId);
                    setDocBuilderOpen(false);
                  }}
                  data-coach="doc-builder-ok"
                  className="oracle-btn-primary"
                >
                  OK
                </button>
                <button onClick={() => setDocBuilderOpen(false)} className="oracle-btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </ModuleFrame>
    );
  }

  // Sub-view: Edit Document (Purchase Order) (Pages 34-38)
  if (currentRoute === 'edit_po') {
    const po = purchaseOrders.find((p) => p.id === selectedId) ?? purchaseOrders[0];
    if (!po) return null;

    return (
      <ModuleFrame
        title={`Edit Document (Purchase Order): ${po.id}`}
        route="edit_po"
        caConceptTitle="CA Concept: Purchase Order (PO)"
        caConceptBody="A purchase order is the promise to the supplier: item, quantity and price. Submit sends it for approval. It stays Pending Approval until a different person approves it. Then it is Open and can be received."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setPdfModalPO(po.id)} className="oracle-btn-secondary">
              <Printer className="w-3.5 h-3.5" /> View PDF
            </button>
            {po.status === 'Incomplete' && (
              <button data-coach="submit-po" onClick={() => submitPO(po.id)} className="oracle-btn-primary">
                Submit
              </button>
            )}
            {po.status === 'Pending Approval' && (
              <button data-coach="approve-po" onClick={() => approvePO(po.id)} className="oracle-btn-primary">
                Approve
              </button>
            )}
            {(po.status === 'Open' || po.status === 'Closed for Receiving') && (
              <button onClick={() => navigate('my_receipts')} className="oracle-btn-primary">
                Receive Goods (GRN) →
              </button>
            )}
            <button onClick={() => navigate('manage_orders')} className="oracle-btn-secondary">
              Done
            </button>
          </div>
        }
      >
        <div className="oracle-panel p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-[#E6ECF0] pb-5 text-[12.5px]">
            <div className="space-y-2">
              <div><span className="text-[#5E6C7A] w-32 inline-block">Procurement BU:</span> {po.procurementBU}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Sold-to Legal Entity:</span> {po.soldToLegalEntity}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Order:</span> <strong>{po.id}</strong></div>
              <div>
                <span className="text-[#5E6C7A] w-32 inline-block">Status:</span>{' '}
                <span
                  className={`px-2 py-0.5 rounded font-semibold text-[11.5px] ${
                    po.status === 'Open' || po.status === 'Closed for Receiving'
                      ? 'bg-green-50 text-[#2E7D32]'
                      : 'bg-amber-50 text-[#D97706]'
                  }`}
                >
                  {po.status}
                </span>
              </div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Buyer:</span> {po.buyer}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[#5E6C7A] w-28">Supplier:</span>
                {po.status === 'Incomplete' ? (
                  <select
                    value={po.supplier}
                    onChange={(e) => {
                      const sup = suppliers.find((s) => s.name === e.target.value);
                      updatePO(po.id, {
                        supplier: e.target.value,
                        supplierSite: sup?.site ?? '',
                        supplierContact: sup?.contact ?? '',
                      });
                    }}
                    className="oracle-select flex-1"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <strong>{po.supplier}</strong>
                )}
              </div>
              <div><span className="text-[#5E6C7A] w-28 inline-block">Supplier Site:</span> {po.supplierSite}</div>
              <div><span className="text-[#5E6C7A] w-28 inline-block">Supplier Contact:</span> {po.supplierContact}</div>
              <div><span className="text-[#5E6C7A] w-28 inline-block">Ship-to Location:</span> {po.shipToLocation}</div>
              <div><span className="text-[#5E6C7A] w-28 inline-block">Payment Terms:</span> {po.paymentTerms}</div>
            </div>

            <div className="space-y-2">
              <div><span className="text-[#5E6C7A] w-28 inline-block">Currency:</span> {po.currency}</div>
              <div><span className="text-[#5E6C7A] w-28 inline-block">Ordered:</span> <strong>₹{po.orderedAmount.toFixed(2)}</strong></div>
              <div><span className="text-[#5E6C7A] w-28 inline-block">Total Tax:</span> ₹{po.taxAmount.toFixed(2)}</div>
              <div><span className="text-[#5E6C7A] w-28 inline-block">Total:</span> <strong className="text-[#00688C] text-[14px]">₹{po.totalAmount.toFixed(2)} {po.currency}</strong></div>
              <div><span className="text-[#5E6C7A] w-28 inline-block">Requisition:</span> {po.requisitionId ?? '—'}</div>
            </div>
          </div>

          {/* Lines */}
          <div>
            <h4 className="text-[13.5px] font-semibold mb-2">Order Lines</h4>
            <div className="overflow-x-auto border border-[#D6DFE6] rounded">
              <table className="w-full text-[12.5px] text-left">
                <thead className="oracle-table-header">
                  <tr>
                    <th className="p-2.5">Line</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Ordered Qty</th>
                    <th className="p-2.5 text-right">Received Qty</th>
                    <th className="p-2.5">UOM</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F5]">
                  {po.lines.map((l) => (
                    <tr key={l.lineNumber}>
                      <td className="p-2.5">{l.lineNumber}</td>
                      <td className="p-2.5 font-medium">{l.description}</td>
                      <td className="p-2.5 text-right">{l.quantity}</td>
                      <td className="p-2.5 text-right font-semibold text-[#00688C]">{l.receivedQty}</td>
                      <td className="p-2.5">{l.uom}</td>
                      <td className="p-2.5 text-right">₹{l.price.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-semibold">₹{l.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {pdfModalPO && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <span className="font-bold text-[#C74634] tracking-wider">ORACLE — Purchase Order #{po.id}</span>
                <button onClick={() => setPdfModalPO(null)}><X className="w-4 h-4" /></button>
              </div>
              <div className="text-[12.5px] space-y-2 mb-4">
                <div><strong>Supplier:</strong> {po.supplier} ({po.supplierSite})</div>
                <div><strong>Legal Entity:</strong> {po.soldToLegalEntity}</div>
                <div><strong>Payment Terms:</strong> {po.paymentTerms}</div>
                <div><strong>Total Ordered:</strong> ₹{po.totalAmount.toFixed(2)} {po.currency}</div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => window.print()} className="oracle-btn-secondary"><Printer className="w-3.5 h-3.5" /> Print</button>
                <button onClick={() => setPdfModalPO(null)} className="oracle-btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}
      </ModuleFrame>
    );
  }

  // Main View: Purchase Orders / Manage Orders (Page 30)
  return (
    <ModuleFrame
      title="Purchase Orders (Manage Orders)"
      route="purchase_orders"
      caConceptTitle="CA Concept: Purchase Order Inquiry & Monitoring"
      caConceptBody="Auditors use Purchase Order Inquiry to check for unauthorized suppliers, duplicate POs, or discrepancies between Ordered Quantity and Received Quantity."
      actions={
        <button onClick={() => navigate('process_requisitions')} className="oracle-btn-primary">
          <Plus className="w-3.5 h-3.5" /> Create PO from Requisition
        </button>
      }
    >
      <div className="oracle-panel p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] text-left">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2.5">PO Number</th>
                <th className="p-2.5">Supplier</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5">Requisition</th>
                <th className="p-2.5">Creation Date</th>
                <th className="p-2.5 text-right">Total</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F5]">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-[#F8FAFC]">
                  <td className="p-2.5">
                    <button
                      onClick={() => navigate('edit_po', po.id)}
                      className="text-[#00688C] font-semibold hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> PO {po.id}
                    </button>
                  </td>
                  <td className="p-2.5 font-medium">{po.supplier}</td>
                  <td className="p-2.5">{po.description}</td>
                  <td className="p-2.5">{po.requisitionId ?? '—'}</td>
                  <td className="p-2.5">{po.creationDate}</td>
                  <td className="p-2.5 text-right font-semibold">₹{po.totalAmount.toFixed(2)} {po.currency}</td>
                  <td className="p-2.5">
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#2E7D32]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {po.status}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <button
                      onClick={() => navigate('edit_po', po.id)}
                      className="text-[#00688C] hover:underline text-[12px]"
                    >
                      Open
                    </button>
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
