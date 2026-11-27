import React, { useState } from 'react';
import { Plus, Search, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { ModuleFrame } from '../ModuleFrame';

export const OrderManagementModule: React.FC = () => {
  const { currentRoute, navigate, customers, items, salesOrders, createSalesOrder, submitSalesOrder } = useERP();

  const [customerName, setCustomerName] = useState('Mehta Stores');
  const [orderType, setOrderType] = useState('Standard');
  const [paymentTerms, setPaymentTerms] = useState('Immediate');
  const [selectedItemCode, setSelectedItemCode] = useState('Laptop');
  const [quantity, setQuantity] = useState(2);
  const [unitPrice, setUnitPrice] = useState(50000);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemQuery, setItemQuery] = useState('');

  if (currentRoute === 'create_sales_order') {
    const cust = customers.find((c) => c.name === customerName) ?? customers[0];
    const item = items.find((i) => i.code === selectedItemCode) ?? items[0];
    const orderTotal = quantity * unitPrice;
    const creditWarning = orderTotal > cust.creditLimit;

    return (
      <ModuleFrame
        title={`Create Order: ${cust.name}`}
        route="create_sales_order"
        caConceptTitle="CA Concept: Sales Order Entry & Credit Limit Control"
        caConceptBody="This is the start of Order-to-Cash (O2C). Oracle Fusion checks the customer's credit limit automatically. Notice how exceeding the credit limit places the order 'On Hold' — a key internal control!"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => {
                const so = createSalesOrder({
                  customer: customerName,
                  orderType,
                  paymentTerms,
                  itemCode: selectedItemCode,
                  quantity,
                  unitPrice,
                });
                if (so.status !== 'On Hold') {
                  submitSalesOrder(so.id);
                }
                navigate('order_management');
              }}
              data-coach="submit-sales-order"
              className="oracle-btn-primary"
            >
              Submit
            </button>
            <button onClick={() => navigate('order_management')} className="oracle-btn-secondary">
              Cancel
            </button>
          </div>
        }
      >
        <div className="oracle-panel p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[12.5px]">
            <div className="space-y-3">
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">* Customer</label>
                <select
                  value={customerName}
                  onChange={(e) => {
                    const c = customers.find((x) => x.name === e.target.value);
                    setCustomerName(e.target.value);
                    if (c) setPaymentTerms(c.paymentTerms);
                  }}
                  className="col-span-2 oracle-select"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>{c.name} (Credit Limit: ₹{c.creditLimit.toLocaleString()})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">Order Type</label>
                <select value={orderType} onChange={(e) => setOrderType(e.target.value)} className="col-span-2 oracle-select">
                  <option value="Standard">Standard</option>
                </select>
              </div>
              <div className="grid grid-cols-3 items-center gap-2">
                <label className="text-right font-medium">Payment Terms</label>
                <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="col-span-2 oracle-select">
                  <option value="Immediate">Immediate</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div><span className="text-[#5E6C7A] w-32 inline-block">Business Unit:</span> <strong>ABC Mumbai Business Unit</strong></div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Bill-to Account:</span> {cust.account}</div>
              <div><span className="text-[#5E6C7A] w-32 inline-block">Ship-to Address:</span> {cust.shipToAddress}</div>
              <div>
                <span className="text-[#5E6C7A] w-32 inline-block">Order Total:</span>{' '}
                <strong className="text-[15px] text-[#00688C]">₹{orderTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR</strong>
              </div>
            </div>
          </div>

          {creditWarning && (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded text-[12.5px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Credit Limit Alert:</strong> Order total (₹{orderTotal.toLocaleString()}) exceeds {cust.name}'s credit limit (₹{cust.creditLimit.toLocaleString()}). Submitting will place this order <strong>On Hold</strong>.
              </span>
            </div>
          )}

          {/* Order Lines */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[14px] font-semibold">Order Lines</h4>
              <button onClick={() => setItemModalOpen(true)} className="oracle-btn-secondary">
                <Search className="w-3.5 h-3.5" /> Search & Select Item
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-4 border border-[#D6DFE6] rounded text-[12.5px]">
              <div>
                <label className="block text-[11px] text-[#5E6C7A] mb-1">Selected Item</label>
                <div className="font-semibold text-[#00688C]">{item.code}</div>
                <div className="text-[11px] text-[#5E5852]">{item.description}</div>
              </div>
              <div>
                <label className="block text-[11px] text-[#5E6C7A] mb-1">Quantity ({item.uom})</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="oracle-input w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5E6C7A] mb-1">Unit Price (INR)</label>
                <input
                  type="number"
                  min={1}
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="oracle-input w-full"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#5E6C7A] mb-1">Line Amount</label>
                <div className="font-bold text-[14px] pt-1">₹{orderTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Select Item Modal (Page 60) */}
        {itemModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded shadow-xl max-w-xl w-full p-5">
              <div className="flex justify-between items-center border-b pb-2.5 mb-3">
                <h4 className="font-semibold text-[14px]">Search and Select: Item</h4>
                <button onClick={() => setItemModalOpen(false)}><X className="w-4 h-4" /></button>
              </div>
              <input
                type="text"
                value={itemQuery}
                onChange={(e) => setItemQuery(e.target.value)}
                placeholder="Search item code or description (e.g. NYLON THREAD)"
                className="oracle-input w-full mb-3"
              />
              <div className="border rounded max-h-56 overflow-y-auto">
                <table className="w-full text-[12.5px] text-left">
                  <thead className="oracle-table-header">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">On-Hand</th>
                      <th className="p-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {items
                      .filter(
                        (i) =>
                          i.code.toLowerCase().includes(itemQuery.toLowerCase()) ||
                          i.description.toLowerCase().includes(itemQuery.toLowerCase())
                      )
                      .map((i) => (
                        <tr
                          key={i.code}
                          onClick={() => {
                            setSelectedItemCode(i.code);
                            setUnitPrice(i.unitPrice);
                            setItemModalOpen(false);
                          }}
                          className="cursor-pointer hover:bg-[#EDF6FA]"
                        >
                          <td className="p-2 font-semibold text-[#00688C]">{i.code}</td>
                          <td className="p-2">{i.description}</td>
                          <td className="p-2 text-right">{i.onHandQty} {i.uom}</td>
                          <td className="p-2 text-right">₹{i.unitPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </ModuleFrame>
    );
  }

  // Overview Dashboard (Page 59)
  const onHoldCount = salesOrders.filter((s) => s.status === 'On Hold').length;
  const awaitingShipCount = salesOrders.filter((s) => s.status === 'Awaiting Shipping').length;

  return (
    <ModuleFrame
      title="Order Management — Overview"
      route="order_management"
      caConceptTitle="CA Concept: Order Management Dashboard"
      caConceptBody="Shows open sales orders, orders on credit hold, and fulfillment status. Next step after creating a Sales Order is Pick Wave & Ship Confirm in Inventory Management."
      actions={
        <div className="flex gap-2">
          <button onClick={() => navigate('create_sales_order')} className="oracle-btn-primary">
            <Plus className="w-3.5 h-3.5" /> Create Order
          </button>
          <button onClick={() => navigate('pick_waves')} className="oracle-btn-secondary">
            Go to Pick & Ship →
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Infolet Cards (Page 59) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="oracle-panel p-4">
            <div className="text-[12px] text-[#5E6C7A] font-medium">Awaiting Shipping</div>
            <div className="text-[28px] font-light text-[#0288D1] mt-1">{awaitingShipCount}</div>
          </div>
          <div className="oracle-panel p-4">
            <div className="text-[12px] text-[#5E6C7A] font-medium">Orders on Credit Hold</div>
            <div className="text-[28px] font-light text-[#C74634] mt-1">{onHoldCount}</div>
          </div>
          <div className="oracle-panel p-4">
            <div className="text-[12px] text-[#5E6C7A] font-medium">Shipped Orders</div>
            <div className="text-[28px] font-light text-[#2E7D32] mt-1">
              {salesOrders.filter((s) => s.status === 'Shipped').length}
            </div>
          </div>
          <div className="oracle-panel p-4">
            <div className="text-[12px] text-[#5E6C7A] font-medium">Total Sales Orders</div>
            <div className="text-[28px] font-light text-[#312D2A] mt-1">{salesOrders.length}</div>
          </div>
        </div>

        {/* Sales Orders Table */}
        <div className="oracle-panel p-5">
          <h3 className="text-[14px] font-semibold mb-3">Sales Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[12.5px] text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2.5">Order #</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Order Type</th>
                  <th className="p-2.5">Ordered Date</th>
                  <th className="p-2.5">Payment Terms</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F5]">
                {salesOrders.map((so) => (
                  <tr key={so.id} className="hover:bg-[#F8FAFC]">
                    <td className="p-2.5 font-semibold text-[#00688C]">{so.id}</td>
                    <td className="p-2.5">{so.customer}</td>
                    <td className="p-2.5">{so.orderType}</td>
                    <td className="p-2.5">{so.orderedDate}</td>
                    <td className="p-2.5">{so.paymentTerms}</td>
                    <td className="p-2.5 text-right font-semibold">₹{so.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="p-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded ${
                          so.status === 'On Hold'
                            ? 'bg-red-50 text-[#C74634]'
                            : so.status === 'Shipped'
                            ? 'bg-green-50 text-[#2E7D32]'
                            : 'bg-blue-50 text-[#0288D1]'
                        }`}
                      >
                        {so.status === 'On Hold' ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {so.status}
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
