export type ModuleRoute =
  | 'home'
  | 'purchase_requisitions'
  | 'create_noncatalog'
  | 'edit_requisition'
  | 'manage_requisitions'
  | 'purchase_orders'
  | 'process_requisitions'
  | 'edit_po'
  | 'manage_orders'
  | 'my_receipts'
  | 'create_receipt'
  | 'payables_invoices'
  | 'create_ap_invoice'
  | 'payables_payments'
  | 'create_ap_payment'
  | 'order_management'
  | 'create_sales_order'
  | 'inventory_management'
  | 'pick_waves'
  | 'manage_shipments'
  | 'edit_shipment'
  | 'receivables_billing'
  | 'review_ar_transaction'
  | 'accounts_receivable'
  | 'create_ar_receipt'
  | 'general_accounting'
  | 'detail_balances'
  | 'journals'
  | 'scheduled_processes'
  | 'audit_reports'
  | 'ca_audit_lab';

export type SpringboardTab =
  | 'Me'
  | 'Procurement'
  | 'Order Management'
  | 'Supply Chain Execution'
  | 'Payables'
  | 'Receivables'
  | 'General Accounting'
  | 'Tools'
  | 'Risk Management';

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  initials: string;
  role: string;
  department: string;
  canApprovePO: boolean;
  canCreatePayment: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  site: string;
  address: string;
  contact: string;
  email: string;
  authorized: boolean;
  paymentTerms: string;
  bankAccount: string;
  bankName: string;
}

export interface Customer {
  id: string;
  number: string;
  name: string;
  account: string;
  billToAddress: string;
  shipToAddress: string;
  creditLimit: number;
  paymentTerms: string;
}

export interface ItemMaster {
  code: string;
  description: string;
  category: string;
  uom: string;
  unitPrice: number;
  onHandQty: number;
  status: 'Active' | 'Inactive';
}

export interface RequisitionLine {
  lineNumber: number;
  lineType: 'Goods' | 'Fixed Price Services';
  itemCode?: string;
  description: string;
  category: string;
  quantity: number;
  uom: string;
  price: number;
  currency: string;
  amount: number;
  supplierName?: string;
  needByDate: string;
}

export interface Requisition {
  id: string; // e.g., NR00027
  description: string;
  bu: string;
  requester: string;
  preparer: string;
  justification: string;
  status: 'Incomplete' | 'Pending approval' | 'Approved' | 'Rejected' | 'Converted to PO';
  createdAt: string;
  totalAmount: number;
  currency: string;
  lines: RequisitionLine[];
}

export interface PurchaseOrderLine {
  lineNumber: number;
  description: string;
  category: string;
  quantity: number;
  receivedQty: number;
  invoicedQty: number;
  uom: string;
  price: number;
  amount: number;
  requisitionId?: string;
}

export interface PurchaseOrder {
  id: string; // e.g., 11
  procurementBU: string;
  requisitioningBU: string;
  soldToLegalEntity: string;
  billToBU: string;
  supplier: string;
  supplierSite: string;
  supplierContact: string;
  buyer: string;
  status: 'Incomplete' | 'Pending Approval' | 'Open' | 'Closed for Receiving' | 'Closed';
  creationDate: string;
  currency: string;
  paymentTerms: string;
  shipToLocation: string;
  billToLocation: string;
  description: string;
  requisitionId?: string;
  orderedAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: PurchaseOrderLine[];
}

export interface GoodsReceipt {
  id: string; // e.g., 102
  poId: string;
  requisitionId?: string;
  supplier: string;
  bu: string;
  transactionDate: string;
  waybill: string;
  packingSlip: string;
  receivedBy: string;
  lines: {
    lineNumber: number;
    description: string;
    quantityReceived: number;
    uom: string;
  }[];
}

export interface APInvoice {
  id: string; // e.g., Inv0011
  bu: string;
  supplier: string;
  supplierSite: string;
  poId?: string;
  receiptId?: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  currency: string;
  amount: number;
  unpaidAmount: number;
  status: 'Needs Revalidation' | 'Validated' | 'Approved' | 'Paid' | 'Partially Paid';
  matchStatus: 'Matched (3-Way)' | 'Price Variance' | 'Qty Variance' | 'Unmatched (No PO)';
  postedToLedger: boolean;
  description: string;
  createdBy: string;
}

export interface APPayment {
  id: string; // e.g., 2332
  bu: string;
  supplier: string;
  supplierSite: string;
  paymentDate: string;
  type: 'Quick' | 'Manual';
  disbursementBank: string;
  currency: string;
  paymentMethod: string;
  paymentProcessProfile: string;
  amount: number;
  invoiceIds: string[];
  status: 'Issued' | 'Negotiable' | 'Cleared';
  createdBy: string;
}

export interface SalesOrderLine {
  lineNumber: number;
  itemCode: string;
  description: string;
  quantity: number;
  uom: string;
  unitPrice: number;
  amount: number;
  fulfillmentStatus: 'Awaiting Pick' | 'Staged' | 'Shipped' | 'Invoiced';
}

export interface SalesOrder {
  id: string; // e.g., SO-1001
  bu: string;
  customer: string;
  billToAccount: string;
  shipToAddress: string;
  orderType: string;
  orderedDate: string;
  paymentTerms: string;
  status: 'Draft' | 'Awaiting Shipping' | 'Picked' | 'Shipped' | 'Closed' | 'On Hold';
  totalAmount: number;
  currency: string;
  lines: SalesOrderLine[];
}

export interface Shipment {
  id: string; // e.g., 290018
  salesOrderId: string;
  customer: string;
  shipFromOrg: string;
  shipToLocation: string;
  shippingMethod: string;
  waybill: string;
  initialShipDate: string;
  status: 'Open' | 'Staged' | 'Confirmed';
  packingSlipGenerated: boolean;
  lines: {
    lineNumber: number;
    itemCode: string;
    description: string;
    uom: string;
    requestedQty: number;
    shippedQty: number;
  }[];
}

export interface ARTransaction {
  id: string; // e.g., 2050108
  bu: string;
  transactionSource: string;
  transactionType: 'INVOICE' | 'CREDIT MEMO';
  salesOrderId?: string;
  shipmentId?: string;
  customer: string;
  customerNumber: string;
  transactionDate: string;
  dueDate: string;
  daysPastDue: number;
  paymentTerms: string;
  currency: string;
  originalAmount: number;
  creditedAmount: number;
  receiptApplied: number;
  balanceDue: number;
  status: 'Incomplete' | 'Complete' | 'Closed';
  postedToLedger: boolean;
  lines: {
    lineNumber: number;
    itemCode: string;
    description: string;
    uom: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

export interface ARReceipt {
  id: string; // e.g., RCPT-501
  bu: string;
  customer: string;
  receiptMethod: string;
  receiptDate: string;
  currency: string;
  amount: number;
  appliedAmount: number;
  unappliedAmount: number;
  appliedInvoiceIds: string[];
  status: 'Confirmed' | 'Applied' | 'Unapplied';
}

export interface GLAccount {
  segment: string;
  description: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  beginningBalance: number;
  debits: number;
  credits: number;
}

export interface JournalEntry {
  id: string;
  batchName: string;
  source: 'Payables' | 'Receivables' | 'Purchasing' | 'Inventory' | 'Manual';
  date: string;
  description: string;
  status: 'Posted' | 'Unposted';
  lines: {
    accountSegment: string;
    accountDescription: string;
    debit: number;
    credit: number;
  }[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  product: string;
  eventType: 'Object Data Insert' | 'Object Data Update' | 'Object Data Delete';
  businessObject: string;
  recordId: string;
  description: string;
  oldValue?: string;
  newValue?: string;
}

export interface ScheduledJob {
  processId: string;
  name: string;
  description: string;
  status: 'Running' | 'Succeeded' | 'Warning';
  submittedBy: string;
  submissionTime: string;
  parameters: Record<string, string>;
  reportType: 'TrialBalance' | 'SupplierAging' | 'ARAging' | 'PayablesAging';
}

export interface InventoryAdjustment {
  id: string;
  date: string;
  itemCode: string;
  description: string;
  adjustmentQty: number;
  reason: string;
  authorizedBy: string;
  hasDocumentation: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetRoute?: ModuleRoute;
  targetId?: string;
}
