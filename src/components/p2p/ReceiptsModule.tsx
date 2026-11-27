import React, { useState } from 'react';
import { Search, PackageCheck, CheckCircle2 } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const ReceiptsModule: React.FC = () => {
  const { currentRoute, selectedId, navigate, purchaseOrders, receipts, createReceipt, showToast } = useERP();
  const [poFilter, setPoFilter] = useState('');
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState(1);
  const [waybill, setWaybill] = useState('WB-99402');
  const [packingSlip, setPackingSlip] = useState('PS-2026-1');

  // Create Receipt screen (Page 42)
  if (currentRoute === 'create_receipt') {
    const po = purchaseOrders.find((p) => p.id === selectedId) ?? purchaseOrders[0];
    if (!po) return null;

    return (
      <ModuleFrame
        title="Create Receipts"
        route="create_receipt"
        caConceptTitle="CA Concept: Goods Receipt Note (GRN)"
        caConceptBody="Receiving goods in Oracle Fusion generates a GRN (Receipt Number). This is critical for 3-Way Matching in Accounts Payable so the company never pays for goods it didn't receive."
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => {
                createReceipt(po.id, receiveQty, waybill, packingSlip);
                navigate('my_receipts');
              }}
              data-coach="submit-receipt"
              className="oracle-btn-primary"
            >
              Submit
            </button>
            <button onClick={() => navigate('my_receipts')} className="oracle-btn-secondary">
              Cancel
            </button>
          </div>
        }
      >
        <div className="oracle-panel p-5">
          <h4 className="text-[14px] font-semibold mb-3">Receipt Lines for Purchase Order {po.id}</h4>
          <div className="overflow-x-auto border border-[#D6DFE6] rounded">
            <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Requisition</th>
                  <th className="p-2.5">Item Description</th>
                  <th className="p-2.5">* Receipt Quantity</th>
                  <th className="p-2.5">UOM</th>
                  <th className="p-2.5">Waybill</th>
                  <th className="p-2.5">Packing Slip</th>
                  <th className="p-2.5">Purchase Order</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5">{po.requisitionId ?? '—'}</td>
                  <td className="p-2.5 font-medium">{po.lines[0]?.description}</td>
                  <td className="p-2.5">
                    <input
                      type="number"
                      min={1}
                      max={po.lines[0]?.quantity ?? 100}
                      value={receiveQty}
                      onChange={(e) => setReceiveQty(Number(e.target.value))}
                      className="oracle-input w-24"
                    />
                  </td>
                  <td className="p-2.5">{po.lines[0]?.uom}</td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={waybill}
                      onChange={(e) => setWaybill(e.target.value)}
                      className="oracle-input w-32"
                    />
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={packingSlip}
                      onChange={(e) => setPackingSlip(e.target.value)}
                      className="oracle-input w-32"
                    />
                  </td>
                  <td className="p-2.5 font-semibold text-[#00688C]">{po.id}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ModuleFrame>
    );
  }

  // Receive Items + Recent Receipts (Page 41)
  const openPOs = purchaseOrders.filter(
    (p) =>
      p.status === 'Open' &&
      (poFilter === '' ||
        p.id.includes(poFilter) ||
        (p.requisitionId && p.requisitionId.toLowerCase().includes(poFilter.toLowerCase())))
  );

  return (
    <ModuleFrame
      title="Receive Items (My Receipts)"
      route="my_receipts"
      caConceptTitle="CA Concept: Receiving & Physical Verification"
      caConceptBody="Once the vendor delivers goods, the receiving clerk searches by PO or Requisition number and records the exact quantity received."
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            data-coach="quick-receive"
            className="oracle-btn-primary"
            onClick={() => {
              const po = purchaseOrders.find(
                (p) => p.status === 'Open' && !p.trainingCase && p.lines.some((l) => l.receivedQty < l.quantity)
              );
              if (!po) {
                showToast('warning', 'No chair order yet', 'Approve your own purchase order first. Leave the paper order PO-10 alone.');
                return;
              }
              const line = po.lines[0];
              const qty = line.quantity - line.receivedQty;
              createReceipt(po.id, qty, 'BD-CHAIRS', 'PS-CHAIRS');
            }}
          >
            Receive the chairs
          </button>
          <button onClick={() => navigate('payables_invoices')} className="oracle-btn-secondary">
            Go to Payables Invoices →
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3">Search Open Purchase Orders to Receive</h3>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div>
              <label className="block text-[11.5px] text-[#5E6C7A] mb-1">Purchase Order / Requisition #</label>
              <input
                type="text"
                value={poFilter}
                onChange={(e) => setPoFilter(e.target.value)}
                placeholder="e.g. 11 or NR00027"
                className="oracle-input w-60"
              />
            </div>
            <button onClick={() => setPoFilter(poFilter)} className="oracle-btn-primary">
              <Search className="w-3.5 h-3.5" /> Search
            </button>
            <button
              disabled={!selectedPoId}
              onClick={() => {
                const po = purchaseOrders.find((p) => p.id === selectedPoId);
                if (po) setReceiveQty(Math.max(1, po.lines[0].quantity - po.lines[0].receivedQty));
                navigate('create_receipt', selectedPoId);
              }}
              className="oracle-btn-primary ml-auto"
            >
              <PackageCheck className="w-3.5 h-3.5" /> Receive
            </button>
          </div>

          <div className="overflow-x-auto border border-[#D6DFE6] rounded">
            <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Select</th>
                  <th className="p-2.5">Purchase Order</th>
                  <th className="p-2.5">Requisition</th>
                  <th className="p-2.5">Item Description</th>
                  <th className="p-2.5">Supplier</th>
                  <th className="p-2.5 text-right">Ordered Qty</th>
                  <th className="p-2.5 text-right">Already Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F5]">
                {openPOs.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => setSelectedPoId(po.id)}
                    className={`cursor-pointer ${selectedPoId === po.id ? 'bg-[#EDF6FA]' : 'hover:bg-[#F8FAFC]'}`}
                  >
                    <td className="p-2.5">
                      <input
                        type="radio"
                        checked={selectedPoId === po.id}
                        onChange={() => setSelectedPoId(po.id)}
                      />
                    </td>
                    <td className="p-2.5 font-semibold text-[#00688C]">PO {po.id}</td>
                    <td className="p-2.5">{po.requisitionId ?? '—'}</td>
                    <td className="p-2.5">{po.description}</td>
                    <td className="p-2.5">{po.supplier}</td>
                    <td className="p-2.5 text-right">{po.lines[0]?.quantity}</td>
                    <td className="p-2.5 text-right">{po.lines[0]?.receivedQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Completed Receipts (Receiving Transactions Inquiry) */}
        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3">Receiving Transactions Inquiry (Completed GRNs)</h3>
          <div className="overflow-x-auto border border-[#D6DFE6] rounded">
            <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Receipt # (GRN)</th>
                  <th className="p-2.5">PO #</th>
                  <th className="p-2.5">Supplier</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Waybill / Packing Slip</th>
                  <th className="p-2.5 text-right">Qty Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F5]">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-2.5 font-semibold text-[#2E7D32] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {r.id}
                    </td>
                    <td className="p-2.5">PO {r.poId}</td>
                    <td className="p-2.5">{r.supplier}</td>
                    <td className="p-2.5">{r.transactionDate}</td>
                    <td className="p-2.5">{r.waybill} / {r.packingSlip}</td>
                    <td className="p-2.5 text-right font-semibold">{r.lines[0]?.quantityReceived} {r.lines[0]?.uom}</td>
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
