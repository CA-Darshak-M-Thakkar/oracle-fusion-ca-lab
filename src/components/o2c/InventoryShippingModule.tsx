import React, { useState } from 'react';
import { PackageCheck, Truck, Printer, CheckCircle2, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const InventoryShippingModule: React.FC = () => {
  const {
    currentRoute,
    selectedId,
    navigate,
    items,
    salesOrders,
    shipments,
    createPickWaveAndConfirm,
    confirmShipment,
  } = useERP();

  const [shippingMethod, setShippingMethod] = useState('Blue Dart Surface');
  const [waybill, setWaybill] = useState('BD-2001');
  const [packingSlipShipmentId, setPackingSlipShipmentId] = useState<string | null>(null);

  // Edit Shipment & Ship Confirm (Page 66)
  if (currentRoute === 'edit_shipment') {
    const shp = shipments.find((s) => s.id === selectedId) ?? shipments[0];
    if (!shp) return null;

    return (
      <ModuleFrame
        title={`Edit Shipment: ${shp.id}`}
        route="edit_shipment"
        caConceptTitle="CA Concept: Ship Confirmation & Revenue Recognition"
        caConceptBody="Ship Confirm hands the goods to the carrier. Revenue is recorded then, because the customer has control of the goods (Ind AS 115). A packing slip and a bill of lading are prepared. Cost of goods sold is also posted."
        actions={
          <div className="flex gap-2">
            {shp.status !== 'Confirmed' && (
              <button
                onClick={() => {
                  confirmShipment(shp.id, shippingMethod, waybill);
                  setPackingSlipShipmentId(shp.id);
                }}
                data-coach="ship-confirm"
                className="oracle-btn-primary"
              >
                <Truck className="w-3.5 h-3.5" /> Ship Confirm
              </button>
            )}
            {shp.packingSlipGenerated && (
              <button onClick={() => setPackingSlipShipmentId(shp.id)} className="oracle-btn-secondary">
                <Printer className="w-3.5 h-3.5" /> View Packing Slip
              </button>
            )}
            <button onClick={() => navigate('manage_shipments')} className="oracle-btn-secondary">
              Done
            </button>
          </div>
        }
      >
        <div className="oracle-panel p-6 space-y-5 text-[12.5px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-4">
            <div className="space-y-3">
              <div><span className="text-[#5E6C7A] w-32 inline-block">Shipment:</span> <strong>{shp.id}</strong></div>
              <div className="flex items-center gap-2">
                <span className="text-[#5E6C7A] w-32">Shipping Method:</span>
                <select
                  value={shippingMethod}
                  onChange={(e) => setShippingMethod(e.target.value)}
                  disabled={shp.status === 'Confirmed'}
                  className="oracle-select"
                >
                  <option value="Blue Dart Surface">Blue Dart Surface</option>
                  <option value="India Post Surface">India Post Surface</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#5E6C7A] w-32">Waybill:</span>
                <input
                  type="text"
                  value={waybill}
                  onChange={(e) => setWaybill(e.target.value)}
                  disabled={shp.status === 'Confirmed'}
                  className="oracle-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div><span className="text-[#5E6C7A] w-32 inline-block">Shipment Status:</span> <strong>{shp.status}</strong></div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Ship-from Org:</span> {shp.shipFromOrg}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Customer:</span> <strong>{shp.customer}</strong></div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Ship-to Location:</span> {shp.shipToLocation}</div>
            </div>
          </div>

          <table className="w-full text-[12.5px] text-left border rounded">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2.5">Item</th>
                <th className="p-2.5">Sales Order</th>
                <th className="p-2.5">UOM</th>
                <th className="p-2.5 text-right">Requested Qty</th>
                <th className="p-2.5 text-right">Shipped Qty</th>
              </tr>
            </thead>
            <tbody>
              {shp.lines.map((l) => (
                <tr key={l.lineNumber}>
                  <td className="p-2.5 font-medium">{l.itemCode} — {l.description}</td>
                  <td className="p-2.5 text-[#00688C]">{shp.salesOrderId}</td>
                  <td className="p-2.5">{l.uom}</td>
                  <td className="p-2.5 text-right">{l.requestedQty}</td>
                  <td className="p-2.5 text-right font-semibold">{l.shippedQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Oracle Packing Slip Modal (Page 66) */}
        {packingSlipShipmentId && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-xl max-w-2xl w-full p-6">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <div>
                  <span className="font-bold text-[#C74634] text-[16px]">ORACLE</span>
                  <span className="ml-4 font-semibold text-[15px]">Packing Slip — Shipment {shp.id}</span>
                </div>
                <button onClick={() => setPackingSlipShipmentId(null)}><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[12px] border p-3 rounded mb-4 bg-[#FAFBFD]">
                <div>
                  <div className="font-semibold text-[#5E6C7A]">Ship From</div>
                  <div>{shp.shipFromOrg} — Exacore Inv Org</div>
                </div>
                <div>
                  <div className="font-semibold text-[#5E6C7A]">Ship To / Bill To</div>
                  <div className="font-semibold">{shp.customer}</div>
                  <div>{shp.shipToLocation}</div>
                </div>
              </div>
              <table className="w-full text-[12px] border mb-4">
                <thead className="bg-[#EFF3F7]">
                  <tr>
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2">UOM</th>
                    <th className="p-2 text-right">Requested</th>
                    <th className="p-2 text-right">Shipped</th>
                  </tr>
                </thead>
                <tbody>
                  {shp.lines.map((l) => (
                    <tr key={l.lineNumber}>
                      <td className="p-2">{l.itemCode}</td>
                      <td className="p-2 text-center">{l.uom}</td>
                      <td className="p-2 text-right">{l.requestedQty}</td>
                      <td className="p-2 text-right font-bold">{l.shippedQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-between items-center">
                <button onClick={() => navigate('receivables_billing')} className="oracle-btn-primary">
                  Verify AR Invoice in Receivables →
                </button>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="oracle-btn-secondary"><Printer className="w-3.5 h-3.5" /> Print</button>
                  <button onClick={() => setPackingSlipShipmentId(null)} className="oracle-btn-secondary">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModuleFrame>
    );
  }

  // Pick Waves (Page 64)
  if (currentRoute === 'pick_waves') {
    const readyOrders = salesOrders.filter((s) => s.status === 'Awaiting Shipping');
    return (
      <ModuleFrame
        title="Inventory Management — Create Pick Wave & Confirm Picks"
        route="pick_waves"
        caConceptTitle="CA Concept: Pick Wave & Pick Confirmation"
        caConceptBody="A Pick Wave groups sales orders for warehouse picking. Pick Confirmation acknowledges that physical goods have been picked from shelves and staged for shipping."
        actions={
          <button onClick={() => navigate('manage_shipments')} className="oracle-btn-secondary">
            Manage Shipments →
          </button>
        }
      >
        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3">Sales Orders Awaiting Pick Wave</h3>
          <table className="w-full text-[12.5px] text-left">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2.5">Sales Order</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Item</th>
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {readyOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-[#5E6C7A]">
                    No orders awaiting pick. Create & submit a Sales Order first.
                  </td>
                </tr>
              ) : (
                readyOrders.map((so) => (
                  <tr key={so.id}>
                    <td className="p-2.5 font-semibold text-[#00688C]">{so.id}</td>
                    <td className="p-2.5">{so.customer}</td>
                    <td className="p-2.5">{so.lines[0]?.itemCode}</td>
                    <td className="p-2.5 text-right">{so.lines[0]?.quantity}</td>
                    <td className="p-2.5">
                      <button
                        onClick={() => {
                          const shp = createPickWaveAndConfirm(so.id);
                          if (shp) navigate('edit_shipment', shp.id);
                        }}
                        data-coach="release-pick"
                        className="oracle-btn-primary"
                      >
                        <PackageCheck className="w-3.5 h-3.5" /> Release Pick Wave & Confirm Pick
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </ModuleFrame>
    );
  }

  // Manage Shipments & Overview (Pages 63-65)
  return (
    <ModuleFrame
      title={currentRoute === 'manage_shipments' ? 'Manage Shipments' : 'Inventory Management'}
      route="inventory_management"
      caConceptTitle="CA Concept: Inventory Management & Shipping"
      caConceptBody="Tracks warehouse on-hand stock, staged picks, and shipments. Auditors compare physical counts against system on-hand quantities here."
      actions={
        <div className="flex gap-2">
          <button onClick={() => navigate('pick_waves')} className="oracle-btn-primary">
            Create Pick Wave
          </button>
          <button onClick={() => navigate('manage_shipments')} className="oracle-btn-secondary">
            Manage Shipments
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3">Shipments (Staged & Confirmed)</h3>
          <table className="w-full text-[12.5px] text-left">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2.5">Shipment #</th>
                <th className="p-2.5">Sales Order</th>
                <th className="p-2.5">Customer</th>
                <th className="p-2.5">Shipping Method</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {shipments.map((s) => (
                <tr key={s.id} className="hover:bg-[#F8FAFC]">
                  <td className="p-2.5 font-semibold text-[#00688C]">{s.id}</td>
                  <td className="p-2.5">{s.salesOrderId}</td>
                  <td className="p-2.5">{s.customer}</td>
                  <td className="p-2.5">{s.shippingMethod}</td>
                  <td className="p-2.5">
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#2E7D32]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {s.status}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <button
                      onClick={() => navigate('edit_shipment', s.id)}
                      className="text-[#00688C] hover:underline font-medium"
                    >
                      {s.status === 'Confirmed' ? 'View / Packing Slip' : 'Edit & Ship Confirm'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3">On-Hand Inventory Balances</h3>
          <table className="w-full text-[12.5px] text-left">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2.5">Item Code</th>
                <th className="p-2.5">Description</th>
                <th className="p-2.5">Category</th>
                <th className="p-2.5">UOM</th>
                <th className="p-2.5 text-right">On-Hand Qty</th>
                <th className="p-2.5 text-right">Unit Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it) => (
                <tr key={it.code}>
                  <td className="p-2.5 font-semibold text-[#00688C]">{it.code}</td>
                  <td className="p-2.5">{it.description}</td>
                  <td className="p-2.5">{it.category}</td>
                  <td className="p-2.5">{it.uom}</td>
                  <td className="p-2.5 text-right font-semibold">{it.onHandQty}</td>
                  <td className="p-2.5 text-right">₹{it.unitPrice.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModuleFrame>
  );
};
