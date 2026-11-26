import React, { useState } from 'react';
import {
  ShoppingCart,
  ChevronDown,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  X,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const RequisitionsModule: React.FC = () => {
  const {
    currentRoute,
    selectedId,
    navigate,
    currentUser,
    suppliers,
    cart,
    addToCart,
    removeFromCart,
    requisitions,
    createRequisitionFromCart,
    submitRequisition,
    approveRequisition,
    showToast,
  } = useERP();

  const [moreTasksOpen, setMoreTasksOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pdfModalReqId, setPdfModalReqId] = useState<string | null>(null);

  // Create Noncatalog Form State
  const [itemType, setItemType] = useState<'Goods' | 'Fixed Price Services'>('Goods');
  const [description, setDescription] = useState('Annual maintenance');
  const [category, setCategory] = useState('Miscellaneous');
  const [quantity, setQuantity] = useState(1);
  const [uom, setUom] = useState('01EACH');
  const [price, setPrice] = useState(1000);
  const [currency, setCurrency] = useState('INR');
  const [supplierName, setSupplierName] = useState('MURALI TECHNOLOGIES');
  const [justification, setJustification] = useState('Annual ERP & IT support contract');

  const handleAddNoncatalogToCart = (e: React.FormEvent) => {
    e.preventDefault();
    addToCart({
      lineNumber: cart.length + 1,
      lineType: itemType,
      description,
      category,
      quantity,
      uom,
      price,
      currency,
      amount: quantity * price,
      supplierName,
      needByDate: '2026-12-15',
    });
  };

  // Sub-view: Create Noncatalog Request (Page 24-25)
  if (currentRoute === 'create_noncatalog') {
    return (
      <ModuleFrame
        title="Create Noncatalog Request"
        route="create_noncatalog"
        caConceptTitle="CA Concept: Purchase Requisition (Internal Shopping List)"
        caConceptBody="A Purchase Requisition is an internal request by a department to acquire goods or services. Unlike a Purchase Order, it is NOT sent to a vendor — it goes through internal budget & manager approval first."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (cart.length === 0) {
                  showToast('warning', 'Cart Empty', 'Click "Add to Cart" first before reviewing.');
                  return;
                }
                const req = createRequisitionFromCart(description, justification, false);
                navigate('edit_requisition', req.id);
              }}
              className="oracle-btn-secondary"
            >
              Review Cart ({cart.length})
            </button>
            <button onClick={() => navigate('purchase_requisitions')} className="oracle-btn-secondary">
              Done
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddNoncatalogToCart} className="oracle-panel p-6">
          <div className="flex items-center justify-between border-b border-[#E6ECF0] pb-3 mb-5">
            <h3 className="text-[15px] font-semibold text-[#161513]">Noncatalog Request Details</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => showToast('info', 'Shopping List', 'Saved item template to My Shopping Lists.')}
                className="oracle-btn-secondary"
              >
                Add to Shopping List
              </button>
              <button type="submit" className="oracle-btn-primary">
                <Plus className="w-3.5 h-3.5" /> Add to Cart
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46]">Item Type</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as 'Goods' | 'Fixed Price Services')}
                  className="col-span-2 oracle-select"
                >
                  <option value="Goods">Goods billed by quantity</option>
                  <option value="Fixed Price Services">Fixed price services</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-start gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46] pt-1">
                  <span className="text-[#C74634]">*</span> Item Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  required
                  className="col-span-2 oracle-input"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46]">
                  <span className="text-[#C74634]">*</span> Category Name
                </label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="col-span-2 oracle-select">
                  <option value="Miscellaneous">Miscellaneous</option>
                  <option value="IT Hardware">IT Hardware</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Office Supplies">Office Supplies</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46]">
                  <span className="text-[#C74634]">*</span> Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="col-span-2 oracle-input"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46]">
                  <span className="text-[#C74634]">*</span> UOM Name
                </label>
                <select value={uom} onChange={(e) => setUom(e.target.value)} className="col-span-2 oracle-select">
                  <option value="01EACH">01EACH</option>
                  <option value="EKG">EKG</option>
                  <option value="BOX">BOX</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46]">
                  <span className="text-[#C74634]">*</span> Price
                </label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  required
                  className="col-span-2 oracle-input"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46]">
                  <span className="text-[#C74634]">*</span> Currency
                </label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="col-span-2 oracle-select">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46]">Suggested Supplier</label>
                <select
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="col-span-2 oracle-select"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} {!s.authorized ? '(Unverified)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 items-start gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46] pt-1">Justification</label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={2}
                  className="col-span-2 oracle-input"
                />
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-[12px] text-right font-medium text-[#524C46]">Line Total</label>
                <div className="col-span-2 text-[14px] font-bold text-[#00688C]">
                  ₹{(quantity * price).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {currency}
                </div>
              </div>
            </div>
          </div>

          {cart.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#E6ECF0] flex items-center justify-between bg-[#EDF6FA] p-3 rounded">
              <span className="text-[12.5px] font-medium text-[#1D3549]">
                {cart.length} item(s) in Cart — Ready to Review & Submit!
              </span>
              <button
                type="button"
                onClick={() => {
                  const req = createRequisitionFromCart(description, justification, false);
                  navigate('edit_requisition', req.id);
                }}
                className="oracle-btn-primary"
              >
                Review & Submit Requisition →
              </button>
            </div>
          )}
        </form>
      </ModuleFrame>
    );
  }

  // Sub-view: Edit Requisition (Page 27)
  if (currentRoute === 'edit_requisition') {
    const req = requisitions.find((r) => r.id === selectedId) ?? requisitions[0];
    if (!req) return null;

    return (
      <ModuleFrame
        title={`Edit Requisition: ${req.id}`}
        route="edit_requisition"
        caConceptTitle="CA Concept: Requisition Review & Approval"
        caConceptBody="Before a requisition can become a Purchase Order, it must be submitted for manager/budget approval. Auditors check that all requisitions have valid business justification."
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('purchase_requisitions')} className="oracle-btn-secondary">
              Shop
            </button>
            <button
              onClick={() => setPdfModalReqId(req.id)}
              className="oracle-btn-secondary"
            >
              <Printer className="w-3.5 h-3.5" /> View PDF
            </button>
            {req.status === 'Incomplete' && (
              <button
                onClick={() => {
                  submitRequisition(req.id);
                  navigate('purchase_requisitions');
                }}
                className="oracle-btn-primary"
              >
                Submit
              </button>
            )}
            {req.status === 'Pending approval' && (
              <button
                onClick={() => approveRequisition(req.id)}
                className="oracle-btn-primary"
              >
                Approve Requisition
              </button>
            )}
            {req.status === 'Approved' && (
              <button
                onClick={() => navigate('process_requisitions')}
                className="oracle-btn-primary"
              >
                Convert to PO →
              </button>
            )}
          </div>
        }
      >
        <div className="oracle-panel p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-[#E6ECF0] pb-5">
            <div className="space-y-2 text-[12.5px]">
              <div><span className="text-[#5E6C7A] w-32 inline-block">Requisitioning BU:</span> <strong>{req.bu}</strong></div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Description:</span> {req.description}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Requester:</span> {req.requester}</div>
            </div>
            <div className="space-y-2 text-[12.5px]">
              <div><span className="text-[#5E6C7A] w-28 inline-block">Justification:</span> {req.justification}</div>
              <div>
                <span className="text-[#5E6C7A] w-28 inline-block">Status:</span>{' '}
                <span className="px-2 py-0.5 rounded bg-[#EDF6FA] text-[#00688C] font-semibold text-[11.5px]">
                  {req.status}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-[12.5px] md:text-right">
              <div>
                <span className="text-[#5E6C7A]">Requisition Amount:</span>{' '}
                <strong className="text-[15px] text-[#00688C]">₹{req.totalAmount.toFixed(2)} {req.currency}</strong>
              </div>
              <div>
                <span className="text-[#5E6C7A]">Approval Amount:</span>{' '}
                <strong>₹{req.totalAmount.toFixed(2)} {req.currency}</strong>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-[13.5px] font-semibold mb-2">Requisition Lines</h4>
            <div className="overflow-x-auto border border-[#D6DFE6] rounded">
              <table className="w-full text-[12.5px] text-left">
                <thead className="oracle-table-header">
                  <tr>
                    <th className="p-2.5">Line</th>
                    <th className="p-2.5">Line Type</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5 text-right">Quantity</th>
                    <th className="p-2.5">UOM</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F5]">
                  {req.lines.map((l) => (
                    <tr key={l.lineNumber} className="hover:bg-[#F8FAFC]">
                      <td className="p-2.5">{l.lineNumber}</td>
                      <td className="p-2.5">{l.lineType.toUpperCase()}</td>
                      <td className="p-2.5 font-medium">{l.description}</td>
                      <td className="p-2.5">{l.category}</td>
                      <td className="p-2.5 text-right">{l.quantity}</td>
                      <td className="p-2.5">{l.uom}</td>
                      <td className="p-2.5 text-right">₹{l.price.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-semibold">₹{l.amount.toFixed(2)} {l.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* View PDF Modal */}
        {pdfModalReqId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <span className="font-bold text-[#C74634] tracking-wider">ORACLE — Requisition Document PDF</span>
                <button onClick={() => setPdfModalReqId(null)}><X className="w-4 h-4" /></button>
              </div>
              <div className="text-[12.5px] space-y-2 mb-4">
                <div><strong>Requisition Number:</strong> {req.id}</div>
                <div><strong>Business Unit:</strong> {req.bu}</div>
                <div><strong>Requester:</strong> {req.requester}</div>
                <div><strong>Status:</strong> {req.status}</div>
                <div><strong>Total Amount:</strong> ₹{req.totalAmount.toFixed(2)} {req.currency}</div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => window.print()} className="oracle-btn-secondary"><Printer className="w-3.5 h-3.5" /> Print</button>
                <button onClick={() => setPdfModalReqId(null)} className="oracle-btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}
      </ModuleFrame>
    );
  }

  // Main View: Purchase Requisitions Home / Manage Requisitions (Page 23, 26, 28)
  const filteredReqs = requisitions.filter(
    (r) =>
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cart.reduce((s, c) => s + c.line.amount, 0);

  return (
    <ModuleFrame
      title={currentRoute === 'manage_requisitions' ? 'Manage Requisitions' : 'Requisitions'}
      route="purchase_requisitions"
      caConceptTitle="CA Concept: Purchase Requisitions Work Area"
      caConceptBody="This is the starting point of the Procure-to-Pay (P2P) cycle. Click 'More Tasks > Request Noncatalog Item' to create a new requisition, add it to Cart, Review, and Submit."
      actions={
        <div className="flex items-center gap-2 relative">
          {/* More Tasks Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMoreTasksOpen(!moreTasksOpen)}
              className="oracle-btn-primary"
            >
              More Tasks <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {moreTasksOpen && (
              <div className="absolute right-0 top-9 w-56 bg-white border border-[#D6DFE6] rounded shadow-xl z-40 py-1 text-[12.5px]">
                <button
                  onClick={() => {
                    navigate('create_noncatalog');
                    setMoreTasksOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#EDF6FA] font-medium text-[#00688C]"
                >
                  Request Noncatalog Item
                </button>
                <button
                  onClick={() => {
                    navigate('create_noncatalog');
                    setMoreTasksOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#EDF6FA]"
                >
                  Enter Requisition Line
                </button>
                <button
                  onClick={() => {
                    navigate('manage_requisitions');
                    setMoreTasksOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#EDF6FA]"
                >
                  Manage Requisitions
                </button>
              </div>
            )}
          </div>

          <button onClick={() => navigate('process_requisitions')} className="oracle-btn-secondary">
            Process Requisitions (Create PO)
          </button>

          {/* Cart Popover */}
          <div className="relative">
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="oracle-btn-secondary relative"
            >
              <ShoppingCart className="w-4 h-4 text-[#00688C]" />
              <span>{cart.length}</span>
            </button>
            {cartOpen && (
              <div className="absolute right-0 top-9 w-80 bg-white border border-[#D6DFE6] rounded shadow-xl z-40 p-4">
                <div className="text-[12.5px] font-semibold border-b pb-2 mb-2 flex justify-between">
                  <span>Shopping Cart ({cart.length})</span>
                  <span>₹{cartTotal.toFixed(2)}</span>
                </div>
                {cart.length === 0 ? (
                  <p className="text-[12px] text-[#5E6C7A] py-3">Your cart is empty. Use More Tasks → Request Noncatalog Item.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cart.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[12px] bg-[#F8FAFC] p-2 rounded">
                        <div>
                          <div className="font-medium">{c.line.description}</div>
                          <div className="text-[#5E6C7A]">₹{c.line.amount.toFixed(2)} × {c.line.quantity} {c.line.uom}</div>
                        </div>
                        <button onClick={() => removeFromCart(idx)} className="text-[#C74634] hover:bg-red-50 p-1 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <div className="pt-2 flex gap-2 justify-end border-t">
                      <button
                        onClick={() => {
                          const req = createRequisitionFromCart(cart[0].line.description, 'Operational need', false);
                          setCartOpen(false);
                          navigate('edit_requisition', req.id);
                        }}
                        className="oracle-btn-secondary"
                      >
                        Review
                      </button>
                      <button
                        onClick={() => {
                          const req = createRequisitionFromCart(cart[0].line.description, 'Operational need', true);
                          setCartOpen(false);
                          showToast('success', 'Submitted', `Requisition ${req.id} submitted and approved!`);
                        }}
                        className="oracle-btn-primary"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      }
    >
      {/* Dark Search Banner (Page 23) */}
      <div className="bg-[#2C2825] text-white p-3.5 rounded-[4px] mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <span className="text-[12.5px] font-medium whitespace-nowrap">Shop by Category ▾</span>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requisitions or catalog items..."
              className="w-full h-8 pl-3 pr-8 rounded-[2px] text-[#161513] text-[12.5px] focus:outline-none"
            />
            <Search className="w-4 h-4 text-[#5E6C7A] absolute right-2.5 top-2" />
          </div>
        </div>
        <div className="text-[12px] text-[#D8D3CC]">
          Requester: <strong className="text-white">{currentUser.name}</strong>
        </div>
      </div>

      {/* Recent Requisitions Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 oracle-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-semibold">Recent Requisitions</h3>
            <button onClick={() => navigate('create_noncatalog')} className="oracle-btn-primary">
              <Plus className="w-3.5 h-3.5" /> Request Noncatalog Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Requisition</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F5]">
                {filteredReqs.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-2.5">
                      <button
                        onClick={() => navigate('edit_requisition', r.id)}
                        className="text-[#00688C] font-semibold hover:underline"
                      >
                        {r.id}
                      </button>
                    </td>
                    <td className="p-2.5">{r.description}</td>
                    <td className="p-2.5 text-right font-medium">₹{r.totalAmount.toFixed(2)}</td>
                    <td className="p-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11.5px] font-medium ${
                          r.status === 'Approved' || r.status === 'Converted to PO'
                            ? 'text-[#2E7D32]'
                            : r.status === 'Pending approval'
                            ? 'text-[#0288D1]'
                            : 'text-[#D97706]'
                        }`}
                      >
                        {r.status === 'Approved' || r.status === 'Converted to PO' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2.5">
                      {r.status === 'Pending approval' && (
                        <button
                          onClick={() => approveRequisition(r.id)}
                          className="text-[11.5px] text-[#00688C] hover:underline font-medium"
                        >
                          Approve
                        </button>
                      )}
                      {r.status === 'Approved' && (
                        <button
                          onClick={() => navigate('process_requisitions')}
                          className="text-[11.5px] text-[#00688C] hover:underline font-medium"
                        >
                          Create PO
                        </button>
                      )}
                      {r.status === 'Incomplete' && (
                        <button
                          onClick={() => navigate('edit_requisition', r.id)}
                          className="text-[11.5px] text-[#00688C] hover:underline font-medium"
                        >
                          Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="oracle-panel p-5">
          <h3 className="text-[15px] font-semibold mb-3">Quick P2P Guide for Students</h3>
          <div className="space-y-3 text-[12px] text-[#524C46]">
            <div className="p-3 bg-[#F8FAFC] rounded border border-[#E6ECF0]">
              <div className="font-semibold text-[#00688C] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Step 1: Request Noncatalog Item
              </div>
              <p className="mt-1">Click "More Tasks → Request Noncatalog Item", enter item details, and click Add to Cart.</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded border border-[#E6ECF0]">
              <div className="font-semibold text-[#00688C]">Step 2: Review & Submit</div>
              <p className="mt-1">Open the Cart icon at top right, click Review, verify amounts, and click Submit.</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded border border-[#E6ECF0]">
              <div className="font-semibold text-[#00688C]">Step 3: Process into PO</div>
              <p className="mt-1">Once Approved, click "Create PO" to turn the Requisition into a Purchase Order.</p>
            </div>
          </div>
        </div>
      </div>
    </ModuleFrame>
  );
};
