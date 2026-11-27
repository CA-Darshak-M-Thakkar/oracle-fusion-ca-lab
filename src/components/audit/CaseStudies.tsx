import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { emitGuide } from '../../guide/events';
import { COMPANY, inr } from '../../data/company';

export const CaseStudies: React.FC = () => {
  const { purchaseOrders, receipts, apInvoices, inventoryAdjustments, salesOrders, shipments, arTransactions, items } = useERP();
  const [tab, setTab] = useState<'91' | '92' | 'lmn' | 'extra'>('91');
  const [movementOn, setMovementOn] = useState(false);
  const [docsOn, setDocsOn] = useState(false);
  const paper = 'A4 Paper Ream';

  const movement = [
    ...purchaseOrders.flatMap((po) =>
      po.lines
        .filter((l) => l.description === paper || l.itemCode === paper)
        .map((l) => ({ when: po.creationDate, what: `Purchase order ${po.id}`, qty: `${l.quantity} ordered`, note: `Price ₹${l.price} a ream` }))
    ),
    ...receipts.flatMap((r) =>
      r.lines
        .filter((l) => l.description === paper)
        .map((l) => ({ when: r.transactionDate, what: `Receipt ${r.id}`, qty: `${l.quantityReceived} received`, note: `Against ${r.poId}` }))
    ),
    ...apInvoices
      .filter((i) => i.description.toLowerCase().includes('ream') || i.poId === 'PO-10')
      .map((i) => ({ when: i.invoiceDate, what: `Bill ${i.id} (${i.status})`, qty: `${i.quantity ?? ''} billed`, note: i.holdReason || i.description })),
    ...inventoryAdjustments
      .filter((a) => a.itemCode === paper)
      .map((a) => ({ when: a.date, what: a.id, qty: `${a.adjustmentQty} adjusted`, note: a.hasDocumentation ? 'Has a paper' : 'No approval paper' })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          ['91', 'Case 9.1 · ABC Limited paper'],
          ['92', 'Case 9.2 · Company ABC'],
          ['lmn', 'Company LMN'],
          ['extra', 'Extra classroom cases'],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id as typeof tab)} className={`rounded px-3 py-2 text-lg ${tab === id ? 'bg-sky-700 text-white' : 'border'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === '91' && (
        <div className="oracle-panel space-y-4 p-5">
          <h3 className="text-2xl font-semibold">Case 9.1 — ABC Limited, procure to pay</h3>
          <p className="text-lg leading-snug">
            {COMPANY.legalEntity} counts the A4 paper in the store and the quantity in the system does not match. You are the CA. Use the inquiries below. Do not skip to a finished answer.
          </p>
          <p className="text-lg">Tools from the Unit 4 notes: purchase orders, receiving, inventory adjustments, and item movement.</p>
          <button
            type="button"
            data-coach="item-movement"
            className="oracle-btn-primary"
            onClick={() => {
              setMovementOn(true);
              emitGuide('item-movement-opened');
            }}
          >
            Show item movement for A4 Paper Ream
          </button>
          {movementOn && (
            <table className="w-full text-left">
              <thead className="oracle-table-header">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Document</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {movement.map((row) => (
                  <tr key={row.what} className="border-t">
                    <td className="p-2">{row.when}</td>
                    <td className="p-2">{row.what}</td>
                    <td className="p-2">{row.qty}</td>
                    <td className="p-2">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-lg">On hand now: {items.find((i) => i.code === paper)?.onHandQty} reams. Compare that with what was ordered, received and billed.</p>
        </div>
      )}

      {tab === '92' && (
        <div className="oracle-panel space-y-4 p-5">
          <h3 className="text-2xl font-semibold">Case 9.2 — Company ABC</h3>
          <p className="text-lg leading-snug">
            Company ABC distributes electronics and is slow to collect. In this practice company the product is a Laptop at ₹50,000, so the sums stay easy. Look at orders, discounts, tax by state, packing slips and bills of lading. Do not start from a written conclusion.
          </p>
          <ul className="list-disc space-y-2 pl-5 text-lg">
            {salesOrders.map((so) => (
              <li key={so.id}>
                {so.id} · {so.customer} · ₹{inr(so.totalAmount)} · {so.status}
                {so.discountPercent ? ` · ${so.discountPercent}% discount on the list price` : ''}
              </li>
            ))}
            {arTransactions.map((tx) => (
              <li key={tx.id}>
                Bill {tx.id} · {tx.customer} · due {tx.dueDate} · taxable ₹{inr(tx.taxableAmount || 0)}
                {tx.igst ? ` · IGST ₹${inr(tx.igst)} (other state)` : ` · CGST ₹${inr(tx.cgst || 0)} + SGST ₹${inr(tx.sgst || 0)}`}
                · still due ₹{inr(tx.balanceDue)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            data-coach="open-shipping-doc"
            className="oracle-btn-primary"
            onClick={() => {
              setDocsOn(true);
              emitGuide('shipping-doc-opened');
            }}
          >
            Open packing slip and bill of lading
          </button>
          {docsOn &&
            shipments.map((s) => (
              <div key={s.id} className="rounded border p-4 text-lg">
                <div className="font-semibold">Shipment {s.id} · {s.customer}</div>
                <p>Packing slip: {s.packingSlipGenerated ? 'prepared' : 'not prepared'} · {s.lines.map((l) => `${l.shippedQty} ${l.uom} ${l.description}`).join(', ')}</p>
                <p>Carrier: {s.shippingMethod}</p>
                <p>Bill of lading: {s.billOfLading || s.waybill}</p>
                <p>Status: {s.status}</p>
              </div>
            ))}
        </div>
      )}

      {tab === 'lmn' && (
        <div className="oracle-panel space-y-4 p-5">
          <h3 className="text-2xl font-semibold">Company LMN — retail clothing</h3>
          <p className="text-lg leading-snug">
            Company LMN sells clothes and has used Fusion for some time. Management is worried about control. (The slide text says “ABC Ltd” by mistake. The company is LMN.)
          </p>
          <table className="w-full text-left text-lg">
            <thead className="oracle-table-header">
              <tr>
                <th className="p-2">Person</th>
                <th className="p-2">What they can do</th>
                <th className="p-2">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">Store manager</td>
                <td className="p-2">Write off stock and approve that write-off</td>
                <td className="p-2">One person can hide missing clothes.</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Buyer</td>
                <td className="p-2">Approve purchase orders up to ₹50,000, but a ₹2,40,000 order was approved by the same buyer</td>
                <td className="p-2">The limit was bypassed.</td>
              </tr>
              <tr className="border-t">
                <td className="p-2">Cashier</td>
                <td className="p-2">Also allowed to change supplier bank accounts</td>
                <td className="p-2">Payment can be diverted.</td>
              </tr>
            </tbody>
          </table>
          <button type="button" data-coach="lmn-reviewed" className="oracle-btn-primary" onClick={() => emitGuide('lmn-reviewed')}>
            I have reviewed this
          </button>
        </div>
      )}

      {tab === 'extra' && (
        <div className="oracle-panel space-y-4 p-5 text-lg leading-snug">
          <h3 className="text-2xl font-semibold">Extra cases (optional)</h3>
          <details>
            <summary className="cursor-pointer font-semibold">1,000 ordered, 900 received, 1,000 billed, plus 18% GST and a duplicate bill</summary>
            <p className="mt-2">ABC Ltd orders 1,000 units at ₹500. The store receives 900. The supplier bills 1,000 and ₹5,00,000 is paid. GST is 18% extra. The same bill number is entered twice.</p>
            <p className="mt-2">Work it before you open the answer: order value ₹5,00,000; received ₹4,50,000; excess bill ₹50,000; GST on the full bill ₹90,000.</p>
          </details>
          <details>
            <summary className="cursor-pointer font-semibold">Sunrise Electronics — 200 invoiced, 150 shipped before the year end</summary>
            <p className="mt-2">A customer orders 200 televisions at ₹30,000. 150 go out on 28 March. All 200 are invoiced on 29 March. The last 50 go out on 4 April. The full ₹60,00,000 is booked in March.</p>
            <p className="mt-2">Ask: did control of the last 50 pass in March? Ind AS 115 follows control, not the invoice date.</p>
          </details>
        </div>
      )}
    </div>
  );
};
