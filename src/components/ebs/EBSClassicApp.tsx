import React, { useState } from 'react';
import {
  Folder,
  FileText,
  ArrowRight,
  CheckCircle2,
  X,
  Minus,
  Square,
  Cloud,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

type EBSWindow =
  | 'navigator'
  | 'requisition_form'
  | 'autocreate'
  | 'po_form'
  | 'receipts'
  | 'receiving_tx'
  | 'invoice_workbench'
  | 'payments'
  | 'requests';

interface EBSClassicAppProps {
  onSwitchToFusion: () => void;
}

export const EBSClassicApp: React.FC<EBSClassicAppProps> = ({ onSwitchToFusion }) => {
  const {
    currentUser,
    suppliers,
    requisitions,
    addToCart,
    createRequisitionFromCart,
    purchaseOrders,
    createPOFromRequisition,
    submitPO,
    receipts,
    createReceipt,
    apInvoices,
    createAPInvoice,
    validateAPInvoice,
    postAPInvoiceToLedger,
    apPayments,
    createAPPayment,
    scheduledJobs,
    showToast,
  } = useERP();

  const [activeWin, setActiveWin] = useState<EBSWindow>('navigator');
  const [navTab, setNavTab] = useState<'Functions' | 'Documents' | 'Processes'>('Functions');
  const [selectedTopTen, setSelectedTopTen] = useState(1);

  // Requisition Form State
  const [reqItem, setReqItem] = useState('AS54999');
  const [reqDesc, setReqDesc] = useState('Sentinel Standard Desktop - Rugged');
  const [reqQty, setReqQty] = useState(1);
  const [reqPrice, setReqPrice] = useState(1000);
  const [reqApproveModal, setReqApproveModal] = useState(false);
  const [lastCreatedReqId, setLastCreatedReqId] = useState<string | null>(null);

  // AutoCreate & PO State
  const [autoReqSearch, setAutoReqSearch] = useState('');
  const [selectedAutoReq, setSelectedAutoReq] = useState<string | null>(null);
  const [activePoId, setActivePoId] = useState<string>(purchaseOrders[0]?.id ?? '11');
  const [poApproveModal, setPoApproveModal] = useState(false);

  // Receipts & Inspect State
  const [rcptPoId, setRcptPoId] = useState<string>(purchaseOrders[0]?.id ?? '11');
  const [rcptQty, setRcptQty] = useState(1);
  const [lastReceiptId, setLastReceiptId] = useState<string | null>(null);
  const [inspectModal, setInspectModal] = useState(false);
  const [inspectedIds, setInspectedIds] = useState<Record<string, boolean>>({});

  // Invoice Workbench State
  const [invTab, setInvTab] = useState<'General' | 'Lines' | 'Holds'>('General');
  const [matchModal, setMatchModal] = useState(false);
  const [actionsModal, setActionsModal] = useState(false);
  const [invPoId, setInvPoId] = useState<string>(purchaseOrders[0]?.id ?? '11');
  const [activeInvId, setActiveInvId] = useState<string>(apInvoices[0]?.id ?? 'Inv0011');

  // Payments State
  const [paySupplier, setPaySupplier] = useState(suppliers[0].name);
  const [selectInvPayModal, setSelectInvPayModal] = useState(false);
  const [chosenPayInvIds, setChosenPayInvIds] = useState<string[]>([]);

  const TOP_TEN: { num: number; label: string; win: EBSWindow }[] = [
    { num: 1, label: 'Requisitions', win: 'requisition_form' },
    { num: 2, label: 'Requisition Summary', win: 'requisition_form' },
    { num: 3, label: 'AutoCreate Documents', win: 'autocreate' },
    { num: 4, label: 'Purchase Orders', win: 'po_form' },
    { num: 5, label: 'Purchase Order Summary', win: 'po_form' },
    { num: 6, label: 'Receipts (V1)', win: 'receipts' },
    { num: 7, label: 'Receiving Transactions (Inspect)', win: 'receiving_tx' },
    { num: 8, label: 'Invoices (Invoice Workbench)', win: 'invoice_workbench' },
    { num: 9, label: 'Payments (Payables)', win: 'payments' },
    { num: 10, label: 'Requests (View Concurrent)', win: 'requests' },
  ];

  const activePo = purchaseOrders.find((p) => p.id === activePoId) ?? purchaseOrders[0];
  const activeInv = apInvoices.find((i) => i.id === activeInvId) ?? apInvoices[0];

  return (
    <div className="min-h-screen bg-[#DCE4EC] flex flex-col font-sans select-none">
      {/* Classic Oracle Applications Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1D4056] bg-[#2D5F7E] px-3 py-1.5 text-[12px] text-white">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <span className="font-bold tracking-wide text-[#FFE082]">ORACLE</span>
          <span>Older product: E-Business Suite R12 forms. Optional comparison only. Class labs are in Fusion Cloud.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[#CDE2EF]">User: {currentUser.name}</span>
          <button
            type="button"
            data-coach="switch-to-fusion"
            onClick={onSwitchToFusion}
            className="flex items-center gap-1.5 rounded-[2px] border border-white/40 bg-[#00688C] px-2.5 py-1 text-[11.5px] font-medium text-white hover:bg-[#00526F]"
          >
            <Cloud className="w-3.5 h-3.5" /> Switch to Oracle Fusion Cloud UI
          </button>
        </div>
      </div>

      {/* Classic Forms Menu Bar */}
      <div className="bg-[#ECEFF3] border-b border-[#B8C4D0] px-3 py-1 flex items-center justify-between text-[11.5px] text-[#1E293B]">
        <div className="flex items-center gap-4">
          {['File', 'Edit', 'View', 'Folder', 'Tools', 'Inquire', 'Window', 'Help'].map((m) => (
            <button
              key={m}
              onClick={() => setActiveWin('navigator')}
              className="hover:bg-[#D0DCE8] px-1.5 py-0.5 rounded-[2px]"
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveWin('navigator')}
            className="px-2 py-0.5 bg-white border border-[#9EB0C2] rounded-[2px] hover:bg-[#EDF3F8]"
          >
            Navigator
          </button>
          <button
            onClick={() => setActiveWin('requests')}
            className="px-2 py-0.5 bg-white border border-[#9EB0C2] rounded-[2px] hover:bg-[#EDF3F8]"
          >
            View Requests
          </button>
        </div>
      </div>

      {/* Desktop Area */}
      <div className="flex-1 p-4 flex items-start justify-center overflow-auto">
        {/* 1. NAVIGATOR WINDOW (Pages 2, 6, 8, 16, 20, 24, 29, 32) */}
        {activeWin === 'navigator' && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>Navigator - Purchasing / Payables, Vision Operations (USA)</span>
              <div className="flex gap-1"><Minus className="w-3.5 h-3.5" /><Square className="w-3 h-3" /><X className="w-3.5 h-3.5" /></div>
            </div>

            <div className="p-3">
              {/* Functions / Documents / Processes Tabs */}
              <div className="flex gap-1 border-b border-[#9EB0C2] mb-3">
                {(['Functions', 'Documents', 'Processes'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNavTab(t)}
                    className={`px-3 py-1 text-[12px] border border-b-0 rounded-t-[3px] ${
                      navTab === t ? 'bg-white font-semibold border-[#9EB0C2]' : 'bg-[#DCE4EC] text-[#475569] border-transparent'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Left Functions Tree */}
                <div className="md:col-span-6 bg-white border border-[#8C9FB1] p-2 h-80 overflow-y-auto text-[12px] space-y-1">
                  <div className="font-semibold text-[#1E293B] flex items-center gap-1.5"><Folder className="w-3.5 h-3.5 text-[#D97706]" /> Purchasing &amp; Payables</div>
                  {[
                    { label: '+ Requisitions → Requisition Summary', win: 'requisition_form' as EBSWindow },
                    { label: '  AutoCreate', win: 'autocreate' as EBSWindow },
                    { label: '+ Purchase Orders → Purchase Order Summary', win: 'po_form' as EBSWindow },
                    { label: '+ Receiving → Receipts', win: 'receipts' as EBSWindow },
                    { label: '+ Receiving → Receiving Transactions (Inspect)', win: 'receiving_tx' as EBSWindow },
                    { label: '+ Invoices → Entry → Invoices', win: 'invoice_workbench' as EBSWindow },
                    { label: '+ Payments → Entry → Payments', win: 'payments' as EBSWindow },
                    { label: '  Requests (View Concurrent Jobs)', win: 'requests' as EBSWindow },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setActiveWin(item.win)}
                      className="w-full text-left pl-4 py-1 hover:bg-[#1E5B88] hover:text-white flex items-center gap-1.5 rounded-[1px]"
                    >
                      <FileText className="w-3 h-3 shrink-0" /> {item.label}
                    </button>
                  ))}
                </div>

                {/* Middle Arrow */}
                <div className="hidden md:flex md:col-span-1 items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-[#2D5F7E]" />
                </div>

                {/* Right Top Ten List */}
                <div className="md:col-span-5 flex flex-col">
                  <div className="text-[12px] font-semibold mb-1">Top Ten List</div>
                  <div className="bg-white border border-[#8C9FB1] p-1.5 flex-1 h-72 overflow-y-auto text-[12px]">
                    {TOP_TEN.map((t) => (
                      <button
                        key={t.num}
                        onClick={() => setSelectedTopTen(t.num)}
                        onDoubleClick={() => setActiveWin(t.win)}
                        className={`w-full text-left px-2 py-1 ${
                          selectedTopTen === t.num ? 'bg-[#1E5B88] text-white' : 'hover:bg-[#EDF3F8]'
                        }`}
                      >
                        {t.num}. {t.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => {
                        const found = TOP_TEN.find((t) => t.num === selectedTopTen);
                        if (found) setActiveWin(found.win);
                      }}
                      className="px-6 py-1 bg-[#E5EBF1] hover:bg-[#D4E0EC] border border-[#7F9DB9] text-[12px] font-medium rounded-[2px]"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. REQUISITION FORM (Pages 3-4) */}
        {activeWin === 'requisition_form' && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>Requisition Summary to Requisitions - [{lastCreatedReqId ?? 'New'}]</span>
              <button onClick={() => setActiveWin('navigator')}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-[12px] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#EBF0F5] p-3 border border-[#BCC8D4]">
                <div>Operating Unit: <input readOnly value="Vision Operations" className="border border-[#8C9FB1] bg-white px-2 py-0.5 w-36 ml-1" /></div>
                <div>Type: <input readOnly value="Purchase Requisition" className="border border-[#8C9FB1] bg-white px-2 py-0.5 w-36 ml-1" /></div>
                <div>Preparer: <input readOnly value={currentUser.name} className="border border-[#8C9FB1] bg-white px-2 py-0.5 w-36 ml-1" /></div>
                <div>Number: <strong className="ml-1">{lastCreatedReqId ?? '(Auto)'}</strong></div>
                <div>Status: <strong className="ml-1 text-[#00688C]">{lastCreatedReqId ? 'Approved' : 'Incomplete'}</strong></div>
                <div>Total INR: <strong className="ml-1">₹{(reqQty * reqPrice).toLocaleString('en-IN')}</strong></div>
              </div>

              <div className="bg-white border border-[#8C9FB1] overflow-x-auto">
                <table className="w-full text-[12px] text-left">
                  <thead className="bg-[#DCE4EC] border-b border-[#8C9FB1]">
                    <tr>
                      <th className="p-1.5 border-r">Num</th>
                      <th className="p-1.5 border-r">Item</th>
                      <th className="p-1.5 border-r">Category</th>
                      <th className="p-1.5 border-r">Description</th>
                      <th className="p-1.5 border-r">UOM</th>
                      <th className="p-1.5 border-r">Quantity</th>
                      <th className="p-1.5">Price (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-1.5 border-r">1</td>
                      <td className="p-1.5 border-r bg-[#FFF9C4]"><input value={reqItem} onChange={(e) => setReqItem(e.target.value)} className="w-24 bg-transparent outline-none" /></td>
                      <td className="p-1.5 border-r bg-[#FFF9C4]">MISC.MISC</td>
                      <td className="p-1.5 border-r bg-[#FFF9C4]"><input value={reqDesc} onChange={(e) => setReqDesc(e.target.value)} className="w-56 bg-transparent outline-none" /></td>
                      <td className="p-1.5 border-r">Each</td>
                      <td className="p-1.5 border-r bg-[#FFF9C4]"><input type="number" min={1} value={reqQty} onChange={(e) => setReqQty(Number(e.target.value))} className="w-16 bg-transparent outline-none" /></td>
                      <td className="p-1.5 bg-[#FFF9C4]"><input type="number" min={1} value={reqPrice} onChange={(e) => setReqPrice(Number(e.target.value))} className="w-24 bg-transparent outline-none" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => setActiveWin('navigator')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9] rounded-[2px]">Close</button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addToCart({
                        lineNumber: 1,
                        lineType: 'Goods',
                        itemCode: reqItem,
                        description: reqDesc,
                        category: 'Miscellaneous',
                        quantity: reqQty,
                        uom: '01EACH',
                        price: reqPrice,
                        currency: 'INR',
                        amount: reqQty * reqPrice,
                        needByDate: '2026-12-15',
                      });
                      setReqApproveModal(true);
                    }}
                    className="px-5 py-1 bg-[#E5EBF1] hover:bg-[#D4E0EC] border border-[#7F9DB9] font-semibold rounded-[2px]"
                  >
                    Approve...
                  </button>
                  {lastCreatedReqId && (
                    <button onClick={() => setActiveWin('autocreate')} className="px-4 py-1 bg-[#2D5F7E] text-white rounded-[2px]">
                      Next: AutoCreate PO →
                    </button>
                  )}
                </div>
              </div>
            </div>

            {reqApproveModal && (
              <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center">
                <div className="bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-2xl w-96 rounded-[3px]">
                  <div className="bg-[#2D5F7E] text-white px-3 py-1 text-[12px] font-semibold">Approve Document</div>
                  <div className="p-4 text-[12px] space-y-3">
                    <label className="flex items-center gap-2 font-medium"><input type="checkbox" defaultChecked /> Submit for Approval</label>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          const req = createRequisitionFromCart(reqDesc, 'EBS Classic Form Entry', true);
                          setLastCreatedReqId(req.id);
                          setSelectedAutoReq(req.id);
                          setReqApproveModal(false);
                          showToast('success', 'Approved', `Purchase Requisition ${req.id} has been approved.`);
                        }}
                        className="px-5 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold"
                      >
                        OK
                      </button>
                      <button onClick={() => setReqApproveModal(false)} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. AUTOCREATE DOCUMENTS (Pages 10-12) */}
        {activeWin === 'autocreate' && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>AutoCreate Documents</span>
              <button onClick={() => setActiveWin('navigator')}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-[12px] space-y-3">
              <div className="flex gap-2 items-center bg-[#EBF0F5] p-2.5 border border-[#BCC8D4]">
                <span>Find Requisition:</span>
                <input value={autoReqSearch} onChange={(e) => setAutoReqSearch(e.target.value)} placeholder="e.g. NR00027" className="border border-[#8C9FB1] bg-white px-2 py-0.5" />
                <button className="px-3 py-0.5 bg-[#E5EBF1] border border-[#7F9DB9] flex items-center gap-1"><Search className="w-3 h-3" /> Find</button>
              </div>
              <div className="bg-white border border-[#8C9FB1] max-h-56 overflow-y-auto">
                <table className="w-full text-[12px] text-left">
                  <thead className="bg-[#DCE4EC] border-b">
                    <tr>
                      <th className="p-1.5">Select</th>
                      <th className="p-1.5">Requisition</th>
                      <th className="p-1.5">Description</th>
                      <th className="p-1.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisitions
                      .filter((r) => r.status === 'Approved' && (autoReqSearch === '' || r.id.includes(autoReqSearch)))
                      .map((r) => (
                        <tr key={r.id} onClick={() => setSelectedAutoReq(r.id)} className={`cursor-pointer ${selectedAutoReq === r.id ? 'bg-[#1E5B88] text-white' : 'hover:bg-[#EDF3F8]'}`}>
                          <td className="p-1.5"><input type="radio" checked={selectedAutoReq === r.id} onChange={() => setSelectedAutoReq(r.id)} /></td>
                          <td className="p-1.5 font-semibold">{r.id}</td>
                          <td className="p-1.5">{r.description}</td>
                          <td className="p-1.5 text-right">₹{r.totalAmount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center bg-[#EBF0F5] p-2.5 border border-[#BCC8D4]">
                <div>Action: <strong>Create</strong> | Document Type: <strong>Standard PO</strong></div>
                <div className="flex gap-2">
                  <button
                    disabled={!selectedAutoReq}
                    onClick={() => {
                      if (!selectedAutoReq) return;
                      const po = createPOFromRequisition(selectedAutoReq, suppliers[0].name);
                      if (po) {
                        setActivePoId(po.id);
                        setActiveWin('po_form');
                      }
                    }}
                    className="px-5 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold disabled:opacity-50"
                  >
                    Automatic
                  </button>
                  <button onClick={() => setActiveWin('navigator')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PURCHASE ORDERS FORM (Pages 12-15) */}
        {activeWin === 'po_form' && activePo && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>AutoCreate to Purchase Orders - {activePo.id}</span>
              <button onClick={() => setActiveWin('navigator')}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-[12px] space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[#EBF0F5] p-3 border border-[#BCC8D4]">
                <div>PO, Rev: <strong>{activePo.id}</strong> (0)</div>
                <div>Type: <strong>Standard Purchase Order</strong></div>
                <div>Currency: <strong>INR</strong></div>
                <div>Supplier: <strong>{activePo.supplier}</strong></div>
                <div>Status: <strong className="text-[#2E7D32]">{activePo.status === 'Open' ? 'Approved' : activePo.status}</strong></div>
                <div>Total: <strong>₹{activePo.totalAmount.toLocaleString('en-IN')}</strong></div>
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveWin('navigator')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Close</button>
                <div className="flex gap-2">
                  {activePo.status === 'Incomplete' && (
                    <button onClick={() => setPoApproveModal(true)} className="px-5 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold">Approve...</button>
                  )}
                  <button onClick={() => { setRcptPoId(activePo.id); setActiveWin('receipts'); }} className="px-4 py-1 bg-[#2D5F7E] text-white">Next: Receive Goods →</button>
                </div>
              </div>
            </div>
            {poApproveModal && (
              <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center">
                <div className="bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-2xl w-96 rounded-[3px]">
                  <div className="bg-[#2D5F7E] text-white px-3 py-1 text-[12px] font-semibold">Approve Document - {activePo.id}</div>
                  <div className="p-4 text-[12px] space-y-3">
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Submit for Approval</label>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { submitPO(activePo.id); setPoApproveModal(false); }} className="px-5 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold">OK</button>
                      <button onClick={() => setPoApproveModal(false)} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. RECEIPTS (V1) (Pages 17-19) */}
        {activeWin === 'receipts' && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>Receipts (V1 - Vision Operations)</span>
              <button onClick={() => setActiveWin('navigator')}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-[12px] space-y-3">
              <div className="flex flex-wrap gap-3 items-center bg-[#EBF0F5] p-3 border border-[#BCC8D4]">
                <div>Purchase Order:
                  <select value={rcptPoId} onChange={(e) => setRcptPoId(e.target.value)} className="ml-2 border border-[#8C9FB1] bg-[#FFF9C4] px-2 py-0.5">
                    {purchaseOrders.filter((p) => p.status === 'Open').map((p) => (
                      <option key={p.id} value={p.id}>PO {p.id} — {p.supplier}</option>
                    ))}
                  </select>
                </div>
                <div>Quantity: <input type="number" min={1} value={rcptQty} onChange={(e) => setRcptQty(Number(e.target.value))} className="ml-1 w-16 border border-[#8C9FB1] bg-[#FFF9C4] px-2 py-0.5" /></div>
                <button
                  onClick={() => {
                    const grn = createReceipt(rcptPoId, rcptQty, 'WB-EBS-1', 'PS-EBS-1');
                    if (grn) setLastReceiptId(grn.id);
                  }}
                  className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold"
                >
                  Save &amp; Generate Receipt #
                </button>
              </div>
              {lastReceiptId && (
                <div className="p-3 bg-green-50 border border-green-300 text-[#1B5E20] font-semibold">
                  Receipt Header (V1): Generated Receipt Number = {lastReceiptId}
                </div>
              )}
              <div className="flex justify-between pt-2">
                <button onClick={() => setActiveWin('navigator')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Close</button>
                <button onClick={() => setActiveWin('receiving_tx')} className="px-4 py-1 bg-[#2D5F7E] text-white">Next: Inspect Goods →</button>
              </div>
            </div>
          </div>
        )}

        {/* 6. RECEIVING TRANSACTIONS - INSPECT (Pages 20-22) */}
        {activeWin === 'receiving_tx' && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>Receiving Transactions (V1) — QA Inspection</span>
              <button onClick={() => setActiveWin('navigator')}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-[12px] space-y-3">
              <div className="bg-white border border-[#8C9FB1]">
                <table className="w-full text-left">
                  <thead className="bg-[#DCE4EC] border-b">
                    <tr>
                      <th className="p-2">Receipt #</th>
                      <th className="p-2">PO #</th>
                      <th className="p-2">Supplier</th>
                      <th className="p-2">Inspection Status</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r) => (
                      <tr key={r.id} className="border-b">
                        <td className="p-2 font-semibold">{r.id}</td>
                        <td className="p-2">{r.poId}</td>
                        <td className="p-2">{r.supplier}</td>
                        <td className="p-2">{inspectedIds[r.id] ? 'Accepted - Standard Receipt' : 'Not Inspected - Standard Receipt'}</td>
                        <td className="p-2">
                          <button onClick={() => { setLastReceiptId(r.id); setInspectModal(true); }} className="px-3 py-0.5 bg-[#E5EBF1] border border-[#7F9DB9]">
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setActiveWin('navigator')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Close</button>
                <button onClick={() => setActiveWin('invoice_workbench')} className="px-4 py-1 bg-[#2D5F7E] text-white">Next: Invoice Workbench →</button>
              </div>
            </div>

            {inspectModal && lastReceiptId && (
              <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center">
                <div className="bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-2xl w-96 rounded-[3px]">
                  <div className="bg-[#2D5F7E] text-white px-3 py-1 text-[12px] font-semibold">QA Inspection — Receipt {lastReceiptId}</div>
                  <div className="p-4 text-[12px] space-y-3">
                    <div>Quality Code: <select className="border border-[#8C9FB1] bg-white px-2 py-0.5 ml-2"><option>Excellent</option><option>Acceptable</option></select></div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setInspectedIds((p) => ({ ...p, [lastReceiptId]: true }));
                          setInspectModal(false);
                          showToast('success', 'QA Inspection Accepted', `Receipt ${lastReceiptId} marked Accepted - Standard Receipt.`);
                        }}
                        className="px-5 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. INVOICE WORKBENCH (PAYABLES) (Pages 24-28, 36) */}
        {activeWin === 'invoice_workbench' && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>Invoice Workbench (Payables, Vision Operations (USA))</span>
              <button onClick={() => setActiveWin('navigator')}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-[12px] space-y-3">
              <div className="flex gap-1 border-b border-[#9EB0C2]">
                {(['General', 'Lines', 'Holds'] as const).map((t) => (
                  <button key={t} onClick={() => setInvTab(t)} className={`px-3 py-1 border border-b-0 ${invTab === t ? 'bg-white font-semibold' : 'bg-[#DCE4EC]'}`}>{t}</button>
                ))}
              </div>

              <div className="bg-white border border-[#8C9FB1] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    Active Invoice:
                    <select value={activeInvId} onChange={(e) => setActiveInvId(e.target.value)} className="ml-2 border border-[#8C9FB1] px-2 py-0.5">
                      {apInvoices.map((i) => (
                        <option key={i.id} value={i.id}>{i.id} — {i.supplier} (₹{i.amount}) [{i.status}]</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={() => setMatchModal(true)} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold">Match</button>
                </div>

                {activeInv && (
                  <div className="grid grid-cols-3 gap-3 bg-[#EBF0F5] p-3 border text-[12px]">
                    <div>Supplier: <strong>{activeInv.supplier}</strong></div>
                    <div>Match Status: <strong>{activeInv.matchStatus}</strong></div>
                    <div>Status: <strong className="bg-[#FFF9C4] px-1.5">{activeInv.status}</strong></div>
                    <div>Amount: <strong>₹{activeInv.amount.toLocaleString('en-IN')}</strong></div>
                    <div>Accounted: <strong>{activeInv.postedToLedger ? 'Yes (Final Post)' : 'No'}</strong></div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <div className="flex gap-2">
                  <button onClick={() => setActionsModal(true)} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold">Actions... 1</button>
                  <button onClick={() => setActiveWin('navigator')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Close</button>
                </div>
                <button onClick={() => setActiveWin('payments')} className="px-4 py-1 bg-[#2D5F7E] text-white">Next: Pay Invoice →</button>
              </div>
            </div>

            {matchModal && (
              <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center">
                <div className="bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-2xl w-96 rounded-[3px]">
                  <div className="bg-[#2D5F7E] text-white px-3 py-1 text-[12px] font-semibold">Match to Receipts</div>
                  <div className="p-4 text-[12px] space-y-3">
                    <div>Select PO to Match:
                      <select value={invPoId} onChange={(e) => setInvPoId(e.target.value)} className="w-full border border-[#8C9FB1] bg-white p-1 mt-1">
                        {purchaseOrders.map((p) => (
                          <option key={p.id} value={p.id}>PO {p.id} — {p.supplier} (₹{p.totalAmount})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          const po = purchaseOrders.find((p) => p.id === invPoId);
                          if (po) {
                            const inv = createAPInvoice({ supplier: po.supplier, poId: po.id, amount: po.lines[0]?.price ?? po.totalAmount, quantity: po.lines[0]?.receivedQty || po.lines[0]?.quantity, unitPrice: po.lines[0]?.price, description: `Matched to PO ${po.id}`, dueDate: '2026-12-22' });
                            if (inv) setActiveInvId(inv.id);
                          }
                          setMatchModal(false);
                        }}
                        className="px-5 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold"
                      >
                        Match
                      </button>
                      <button onClick={() => setMatchModal(false)} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {actionsModal && activeInv && (
              <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center">
                <div className="bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-2xl w-80 rounded-[3px]">
                  <div className="bg-[#2D5F7E] text-white px-3 py-1 text-[12px] font-semibold">Invoice Actions</div>
                  <div className="p-4 text-[12px] space-y-2">
                    <button onClick={() => { validateAPInvoice(activeInv.id); setActionsModal(false); }} className="w-full text-left px-3 py-1.5 bg-white border hover:bg-[#EDF3F8]">✓ Validate</button>
                    <button onClick={() => { postAPInvoiceToLedger(activeInv.id); setActionsModal(false); }} className="w-full text-left px-3 py-1.5 bg-white border hover:bg-[#EDF3F8]">✓ Create Accounting (Final Post to GL)</button>
                    <div className="flex justify-end pt-2">
                      <button onClick={() => setActionsModal(false)} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. PAYMENTS (PAYABLES) (Pages 29-30) */}
        {activeWin === 'payments' && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>Payments (Payables, Vision Operations (USA))</span>
              <button onClick={() => setActiveWin('navigator')}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-[12px] space-y-3">
              <div className="flex gap-3 items-center bg-[#EBF0F5] p-3 border border-[#BCC8D4]">
                <div>Trading Partner:
                  <select value={paySupplier} onChange={(e) => { setPaySupplier(e.target.value); setChosenPayInvIds([]); }} className="ml-2 border border-[#8C9FB1] bg-[#FFF9C4] px-2 py-0.5">
                    {suppliers.map((s) => (<option key={s.id} value={s.name}>{s.name}</option>))}
                  </select>
                </div>
                <button onClick={() => setSelectInvPayModal(true)} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold">Enter/Adjust Invoices</button>
                <button
                  disabled={chosenPayInvIds.length === 0}
                  onClick={() => {
                    createAPPayment({ supplier: paySupplier, disbursementBank: 'ORCS_ORG_A/C', paymentMethod: '10_CHECK', paymentProcessProfile: '001_HCL_PPR US PAYMENT SYSTEM', invoiceIds: chosenPayInvIds });
                    setChosenPayInvIds([]);
                  }}
                  className="px-4 py-1 bg-[#2D5F7E] text-white disabled:opacity-50"
                >
                  Confirm Payment
                </button>
              </div>
              <div className="bg-white border border-[#8C9FB1] p-2">
                <div className="font-semibold mb-1">Issued Payments ({apPayments.length})</div>
                {apPayments.map((p) => (
                  <div key={p.id} className="py-1 border-b text-[11.5px] flex justify-between">
                    <span>Payment #{p.id} — {p.supplier} (Invoices: {p.invoiceIds.join(', ')})</span>
                    <strong>₹{p.amount.toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setActiveWin('navigator')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Close</button>
                <button onClick={() => setActiveWin('requests')} className="px-4 py-1 bg-[#2D5F7E] text-white">Next: View Requests →</button>
              </div>
            </div>

            {selectInvPayModal && (
              <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center">
                <div className="bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-2xl w-96 rounded-[3px]">
                  <div className="bg-[#2D5F7E] text-white px-3 py-1 text-[12px] font-semibold">Select Invoices ({paySupplier})</div>
                  <div className="p-4 text-[12px] space-y-2">
                    {apInvoices.filter((i) => i.supplier === paySupplier && i.unpaidAmount > 0).map((i) => (
                      <label key={i.id} className="flex items-center justify-between p-1.5 bg-white border">
                        <span><input type="checkbox" checked={chosenPayInvIds.includes(i.id)} onChange={() => setChosenPayInvIds((p) => p.includes(i.id) ? p.filter((x) => x !== i.id) : [...p, i.id])} className="mr-2" />{i.id}</span>
                        <strong>₹{i.unpaidAmount.toLocaleString('en-IN')}</strong>
                      </label>
                    ))}
                    <div className="flex justify-end pt-2">
                      <button onClick={() => setSelectInvPayModal(false)} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9] font-semibold">Save &amp; Close</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9. REQUESTS (CONCURRENT REQUESTS) (Pages 31, 36-37) */}
        {activeWin === 'requests' && (
          <div className="w-full max-w-4xl bg-[#F4F6F8] border-2 border-[#3C6E8F] shadow-xl rounded-[3px]">
            <div className="bg-gradient-to-r from-[#2D5F7E] to-[#4B85A8] text-white px-3 py-1 flex items-center justify-between text-[12px] font-semibold">
              <span>Requests (Concurrent Programs &amp; Journal Import)</span>
              <button onClick={() => setActiveWin('navigator')}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-[12px] space-y-3">
              <div className="bg-white border border-[#8C9FB1]">
                <table className="w-full text-left">
                  <thead className="bg-[#DCE4EC] border-b">
                    <tr>
                      <th className="p-2">Request ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Phase</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledJobs.map((j) => (
                      <tr key={j.processId} className="border-b">
                        <td className="p-2 font-mono">{j.processId}</td>
                        <td className="p-2 font-medium">{j.name}</td>
                        <td className="p-2">Completed</td>
                        <td className="p-2 text-[#2E7D32] font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Normal</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setActiveWin('navigator')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9]">Close</button>
                <button onClick={() => setActiveWin('requests')} className="px-4 py-1 bg-[#E5EBF1] border border-[#7F9DB9] flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Refresh Data</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
