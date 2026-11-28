import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ModuleRoute,
  SpringboardTab,
  UserProfile,
  Supplier,
  Customer,
  ItemMaster,
  Requisition,
  RequisitionLine,
  PurchaseOrder,
  GoodsReceipt,
  APInvoice,
  APPayment,
  SalesOrder,
  Shipment,
  ARTransaction,
  ARReceipt,
  GLAccount,
  JournalEntry,
  AuditLog,
  ScheduledJob,
  InventoryAdjustment,
  NotificationItem,
  BankStatementLine,
} from '../types/erp';
import { GOOGLE_SHEET_WEBHOOK_URL } from '../config/attendance';
import { classRoleFor, isTeacherEmail } from '../config/auth';
import {
  ACCOUNT_NAMES,
  ACCT,
  COMPANY,
  daysPastDue,
  dueDateFrom,
  splitGst,
} from '../data/company';
import {
  DEMO_USERS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_ITEMS,
  INITIAL_REQUISITIONS,
  INITIAL_POS,
  INITIAL_RECEIPTS,
  INITIAL_AP_INVOICES,
  INITIAL_AP_PAYMENTS,
  INITIAL_SALES_ORDERS,
  INITIAL_SHIPMENTS,
  INITIAL_AR_TRANSACTIONS,
  INITIAL_AR_RECEIPTS,
  INITIAL_GL_ACCOUNTS,
  INITIAL_JOURNALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SCHEDULED_JOBS,
  INITIAL_INVENTORY_ADJUSTMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BANK_LINES,
} from '../data/seedData';
import { e2eBypassEnabled } from '../config/e2e';
import { emitGuide } from '../guide/events';
import { formatHash, parseHash } from '../guide/hash';

interface CartItem {
  line: RequisitionLine;
}

interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface ERPContextType {
  isSignedIn: boolean;
  currentUser: UserProfile;
  signIn: (details: { name: string; email: string }) => void;
  signOut: () => void;
  switchUser: (userId: string) => void;
  currentRoute: ModuleRoute;
  selectedId: string | null;
  activeSpringboardTab: SpringboardTab;
  setActiveSpringboardTab: (tab: SpringboardTab) => void;
  navigate: (route: ModuleRoute, id?: string | null) => void;
  favorites: { label: string; route: ModuleRoute }[];
  toggleFavorite: (label: string, route: ModuleRoute) => void;
  teachingMode: boolean;
  setTeachingMode: (val: boolean) => void;
  activeLabId: string | null;
  setActiveLabId: (id: string | null) => void;
  suppliers: Supplier[];
  customers: Customer[];
  items: ItemMaster[];
  cart: CartItem[];
  addToCart: (line: RequisitionLine) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  requisitions: Requisition[];
  createRequisitionFromCart: (description: string, justification: string, submitImmediately: boolean) => Requisition;
  submitRequisition: (reqId: string) => void;
  approveRequisition: (reqId: string) => void;
  purchaseOrders: PurchaseOrder[];
  createPOFromRequisition: (reqId: string, supplierName?: string) => PurchaseOrder | null;
  updatePO: (poId: string, updates: Partial<PurchaseOrder>) => void;
  submitPO: (poId: string) => void;
  approvePO: (poId: string) => void;
  receipts: GoodsReceipt[];
  createReceipt: (poId: string, qty: number, waybill: string, packingSlip: string) => GoodsReceipt | null;
  apInvoices: APInvoice[];
  createAPInvoice: (data: {
    supplier: string;
    poId?: string;
    amount: number;
    description: string;
    dueDate: string;
    quantity?: number;
    unitPrice?: number;
  }) => APInvoice | null;
  validateAPInvoice: (invId: string) => void;
  releaseInvoiceHold: (invId: string) => void;
  postAPInvoiceToLedger: (invId: string) => void;
  apPayments: APPayment[];
  createAPPayment: (data: {
    supplier: string;
    disbursementBank: string;
    paymentMethod: string;
    paymentProcessProfile: string;
    invoiceIds: string[];
  }) => APPayment | null;
  salesOrders: SalesOrder[];
  createSalesOrder: (data: {
    customer: string;
    orderType: string;
    paymentTerms: string;
    itemCode: string;
    quantity: number;
    unitPrice: number;
  }) => SalesOrder;
  submitSalesOrder: (soId: string) => void;
  shipments: Shipment[];
  createPickWaveAndConfirm: (soId: string) => Shipment | null;
  confirmShipment: (shipmentId: string, shippingMethod: string, waybill: string) => ARTransaction | null;
  arTransactions: ARTransaction[];
  postARTransactionToLedger: (txId: string) => void;
  createCreditMemo: (txId: string, amount: number, reason: string) => void;
  arReceipts: ARReceipt[];
  createARReceipt: (data: {
    customer: string;
    receiptMethod: string;
    amount: number;
    applyToInvoiceId?: string;
  }) => ARReceipt;
  bankLines: BankStatementLine[];
  reconcileBankLine: (lineId: string, receiptId: string) => void;
  glAccounts: GLAccount[];
  journals: JournalEntry[];
  createManualJournal: (description: string, debitAccount: string, creditAccount: string, amount: number) => void;
  scheduledJobs: ScheduledJob[];
  scheduleNewProcess: (reportType: ScheduledJob['reportType'], params: Record<string, string>) => ScheduledJob;
  auditLogs: AuditLog[];
  auditEnabledObjects: Record<string, boolean>;
  toggleAuditObject: (obj: string) => void;
  inventoryAdjustments: InventoryAdjustment[];
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'oracle_fusion_ca_sim_inr_v3';
const ERPContext = createContext<ERPContextType | undefined>(undefined);

function nowTimestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

type Jel = { segment: string; debit: number; credit: number };

function gstLines(gst: { cgst: number; sgst: number; igst: number }, direction: 'input' | 'output'): Jel[] {
  const lines: Jel[] = [];
  const add = (segment: string, amount: number) => {
    if (!amount) return;
    lines.push(direction === 'input' ? { segment, debit: amount, credit: 0 } : { segment, debit: 0, credit: amount });
  };
  add(direction === 'input' ? ACCT.inputCgst : ACCT.outputCgst, gst.cgst);
  add(direction === 'input' ? ACCT.inputSgst : ACCT.outputSgst, gst.sgst);
  add(direction === 'input' ? ACCT.inputIgst : ACCT.outputIgst, gst.igst);
  return lines;
}

function cleanStoredUser(raw: UserProfile | undefined): UserProfile {
  const base = raw ?? DEMO_USERS[0];
  const copy = { ...base } as UserProfile & { mobile?: string; wroNo?: string };
  delete copy.mobile;
  delete copy.wroNo;
  return {
    ...copy,
    roleId: copy.roleId || 'requester',
    isTeacher: isTeacherEmail(copy.email),
    canCreateInvoice: !!copy.canCreateInvoice,
    canReceive: !!copy.canReceive,
    approvalLimit: copy.approvalLimit ?? 0,
  };
}

/** Simple, predictable document numbers for teaching (REQ-101, PO-201, GRN-301, BILL-401, PAY-501): the first free number from the start value. Same numbers as p2p-source/data.yaml. */
function simpleId(prefix: string, first: number, taken: string[]): string {
  let n = first;
  while (taken.includes(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const saved = loadSaved();
  const boot = parseHash();

  const [isSignedIn, setIsSignedIn] = useState<boolean>(saved?.isSignedIn ?? false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(cleanStoredUser(saved?.currentUser));
  const [currentRoute, setCurrentRoute] = useState<ModuleRoute>(boot?.route ?? 'home');
  const [selectedId, setSelectedId] = useState<string | null>(boot?.id ?? null);
  const [activeSpringboardTab, setActiveSpringboardTab] = useState<SpringboardTab>('Procurement');
  const [teachingMode, setTeachingModeState] = useState<boolean>(false);
  const [activeLabId, setActiveLabId] = useState<string | null>('p2p');
  const [favorites, setFavorites] = useState<{ label: string; route: ModuleRoute }[]>(
    saved?.favorites ?? [
      { label: 'Purchase Requisitions', route: 'purchase_requisitions' },
      { label: 'Purchase Orders', route: 'purchase_orders' },
      { label: 'Order Management', route: 'order_management' },
      { label: 'Audit Reports', route: 'audit_reports' },
    ]
  );
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [customers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [items, setItems] = useState<ItemMaster[]>(saved?.items ?? INITIAL_ITEMS);
  const [cart, setCart] = useState<CartItem[]>(saved?.cart ?? []);
  const [requisitions, setRequisitions] = useState<Requisition[]>(saved?.requisitions ?? INITIAL_REQUISITIONS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(saved?.purchaseOrders ?? INITIAL_POS);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>(saved?.receipts ?? INITIAL_RECEIPTS);
  const [apInvoices, setApInvoices] = useState<APInvoice[]>(saved?.apInvoices ?? INITIAL_AP_INVOICES);
  const [apPayments, setApPayments] = useState<APPayment[]>(saved?.apPayments ?? INITIAL_AP_PAYMENTS);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(saved?.salesOrders ?? INITIAL_SALES_ORDERS);
  const [shipments, setShipments] = useState<Shipment[]>(saved?.shipments ?? INITIAL_SHIPMENTS);
  const [arTransactions, setArTransactions] = useState<ARTransaction[]>(saved?.arTransactions ?? INITIAL_AR_TRANSACTIONS);
  const [arReceipts, setArReceipts] = useState<ARReceipt[]>(saved?.arReceipts ?? INITIAL_AR_RECEIPTS);
  const [bankLines, setBankLines] = useState<BankStatementLine[]>(saved?.bankLines ?? INITIAL_BANK_LINES);
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>(saved?.glAccounts ?? INITIAL_GL_ACCOUNTS);
  const [journals, setJournals] = useState<JournalEntry[]>(saved?.journals ?? INITIAL_JOURNALS);
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>(saved?.scheduledJobs ?? INITIAL_SCHEDULED_JOBS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(saved?.auditLogs ?? INITIAL_AUDIT_LOGS);
  const [auditEnabledObjects, setAuditEnabledObjects] = useState<Record<string, boolean>>(
    saved?.auditEnabledObjects ?? {
      PurchaseRequisitionVO: true,
      PurchaseOrderHeaderVO: true,
      ReceiptHeaderVO: true,
      APInvoiceVO: true,
      PaymentVO: true,
      SalesOrderVO: true,
      ShipmentVO: true,
      ARTransactionVO: true,
      InventoryBalanceVO: true,
    }
  );
  const [inventoryAdjustments] = useState<InventoryAdjustment[]>(INITIAL_INVENTORY_ADJUSTMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(saved?.notifications ?? INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (!currentUser.isTeacher) setTeachingModeState(false);
  }, [currentUser.isTeacher, currentUser.email]);

  useEffect(() => {
    const safe = { ...currentUser } as UserProfile & { mobile?: string; wroNo?: string };
    delete safe.mobile;
    delete safe.wroNo;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isSignedIn,
          currentUser: safe,
          favorites,
          items,
          cart,
          requisitions,
          purchaseOrders,
          receipts,
          apInvoices,
          apPayments,
          salesOrders,
          shipments,
          arTransactions,
          arReceipts,
          bankLines,
          glAccounts,
          journals,
          scheduledJobs,
          auditLogs,
          auditEnabledObjects,
          notifications,
        })
      );
    } catch {
      /* ignore quota */
    }
  }, [
    isSignedIn, currentUser, favorites, items, cart, requisitions, purchaseOrders, receipts, apInvoices,
    apPayments, salesOrders, shipments, arTransactions, arReceipts, bankLines, glAccounts, journals,
    scheduledJobs, auditLogs, auditEnabledObjects, notifications,
  ]);

  useEffect(() => {
    const apply = () => {
      const parsed = parseHash();
      if (!parsed) return;
      setCurrentRoute(parsed.route);
      setSelectedId(parsed.id);
    };
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  const showToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const addAuditLog = useCallback(
    (product: string, eventType: AuditLog['eventType'], businessObject: string, recordId: string, description: string, oldValue?: string, newValue?: string) => {
      if (auditEnabledObjects[businessObject] === false) return;
      const entry: AuditLog = {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: nowTimestamp(),
        user: currentUser.name,
        product,
        eventType,
        businessObject,
        recordId,
        description,
        oldValue,
        newValue,
      };
      setAuditLogs((prev) => [entry, ...prev]);
    },
    [auditEnabledObjects, currentUser.name]
  );

  const postJournal = useCallback((source: JournalEntry['source'], description: string, lines: Jel[]) => {
    const clean = lines.filter((l) => l.debit > 0.001 || l.credit > 0.001);
    setGlAccounts((prev) =>
      prev.map((acc) => {
        const extraDr = clean.filter((l) => l.segment === acc.segment).reduce((s, l) => s + l.debit, 0);
        const extraCr = clean.filter((l) => l.segment === acc.segment).reduce((s, l) => s + l.credit, 0);
        if (!extraDr && !extraCr) return acc;
        return { ...acc, debits: acc.debits + extraDr, credits: acc.credits + extraCr };
      })
    );
    const je: JournalEntry = {
      id: `JE-${Math.floor(1000 + Math.random() * 9000)}`,
      batchName: `${source}`,
      source,
      date: todayDate(),
      description,
      status: 'Posted',
      lines: clean.map((l) => ({
        accountSegment: l.segment,
        accountDescription: ACCOUNT_NAMES[l.segment] ?? l.segment,
        debit: l.debit,
        credit: l.credit,
      })),
    };
    setJournals((prev) => [je, ...prev]);
  }, []);

  const navigate = useCallback((route: ModuleRoute, id: string | null = null) => {
    setCurrentRoute(route);
    setSelectedId(id);
    const stepId = parseHash()?.stepId ?? null;
    const next = formatHash(route, id, stepId);
    if (window.location.hash !== next) history.replaceState(null, '', next);
  }, []);

  const setTeachingMode = (val: boolean) => {
    if (!currentUser.isTeacher) {
      setTeachingModeState(false);
      return;
    }
    setTeachingModeState(val);
  };

  const signIn = (details: { name: string; email: string }) => {
    const email = details.email.trim().toLowerCase();
    const name = details.name.trim();
    const teacher = isTeacherEmail(email);
    const base = DEMO_USERS.find((u) => u.roleId === 'requester') ?? DEMO_USERS[0];
    const parts = name.split(/\s+/).filter(Boolean);
    const initials = parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
    const user: UserProfile = { ...base, id: email, name, email, initials, isTeacher: teacher, roleId: 'requester' };
    setCurrentUser(user);
    setIsSignedIn(true);
    setTeachingModeState(teacher);
    setCurrentRoute('orientation');
    setSelectedId(null);
    history.replaceState(null, '', formatHash('orientation', null, 'ori-erp'));
    window.dispatchEvent(new CustomEvent('fusion-guide-reset'));
    const role = classRoleFor(email);
    if (GOOGLE_SHEET_WEBHOOK_URL && !e2eBypassEnabled) {
      fetch(GOOGLE_SHEET_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          name,
          email,
          mobile: '',
          wroNo: '',
          notes: role,
          role,
        }),
      }).catch(() => undefined);
    }
    showToast('success', 'Signed in', `Welcome, ${name}. You are signed in as a ${role}.`);
  };

  const signOut = () => {
    setIsSignedIn(false);
    setTeachingModeState(false);
    setCurrentRoute('home');
    history.replaceState(null, '', '#home');
  };

  const switchUser = (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId || u.roleId === userId);
    if (!found) return;
    setCurrentUser((prev) => ({
      ...prev,
      roleId: found.roleId,
      role: found.role,
      department: found.department,
      canApprovePO: found.canApprovePO,
      canCreatePayment: found.canCreatePayment,
      canCreateInvoice: found.canCreateInvoice,
      canReceive: found.canReceive,
      approvalLimit: found.approvalLimit,
    }));
    emitGuide(`role-${found.roleId}`);
    showToast('info', 'Role changed', `You are now the ${found.role}. Your name is still ${currentUser.name}.`);
  };

  const toggleFavorite = (label: string, route: ModuleRoute) => {
    setFavorites((prev) => (prev.some((f) => f.route === route) ? prev.filter((f) => f.route !== route) : [...prev, { label, route }]));
  };

  const sodBlock = (createdByRole: string | undefined, amount: number) => {
    if (!currentUser.canApprovePO) {
      return `You are the ${currentUser.role}. The person who prepares a document cannot approve it. Open your name at the top right and choose Approver.`;
    }
    if (createdByRole && createdByRole === currentUser.roleId) {
      return 'The same role cannot create and approve. Switch to Approver if you prepared this as someone else, or ask a different person.';
    }
    if (amount > currentUser.approvalLimit) {
      return `This is above your approval limit of ₹${currentUser.approvalLimit.toLocaleString('en-IN')}. A higher approver is needed. That is the control in the Company LMN case.`;
    }
    return null;
  };

  const addToCart = (line: RequisitionLine) => {
    const item = items.find((i) => i.description === line.description || i.code === line.itemCode);
    setCart((prev) => [...prev, { line: { ...line, itemCode: line.itemCode || item?.code, uom: line.uom || item?.uom || 'Nos' } }]);
    showToast('success', 'Added to the cart', `${line.description}: ${line.quantity} ${line.uom} × ₹${line.price.toLocaleString('en-IN')}.`);
    emitGuide('cart-added');
  };
  const removeFromCart = (index: number) => setCart((prev) => prev.filter((_, i) => i !== index));
  const clearCart = () => setCart([]);

  const createRequisitionFromCart = (description: string, justification: string, submitImmediately: boolean) => {
    const id = simpleId('REQ', 101, requisitions.map((r) => r.id));
    const lines = cart.map((c, idx) => ({ ...c.line, lineNumber: idx + 1 }));
    const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);
    const status: Requisition['status'] = submitImmediately ? 'Pending approval' : 'Incomplete';
    const req: Requisition = {
      id,
      description: description || lines[0]?.description || 'Purchase request',
      bu: COMPANY.bu,
      requester: currentUser.name,
      preparer: currentUser.name,
      justification: justification || 'Needed for the office',
      status,
      createdByRole: currentUser.roleId,
      createdAt: todayDate(),
      totalAmount,
      currency: 'INR',
      lines,
    };
    setRequisitions((prev) => [req, ...prev]);
    setCart([]);
    addAuditLog('Procurement', 'Object Data Insert', 'PurchaseRequisitionVO', id, `Created request ${id} for ₹${totalAmount.toFixed(2)}`, undefined, `Status=${status}`);
    if (submitImmediately) emitGuide('requisition-submitted');
    else emitGuide('requisition-drafted');
    showToast('success', submitImmediately ? 'Sent for approval' : 'Request saved', `${id} is ${status}. You cannot approve your own request.`);
    return req;
  };

  const submitRequisition = (reqId: string) => {
    const req = requisitions.find((r) => r.id === reqId);
    if (!req) return;
    setRequisitions((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: 'Pending approval', createdByRole: r.createdByRole || currentUser.roleId } : r)));
    addAuditLog('Procurement', 'Object Data Update', 'PurchaseRequisitionVO', reqId, `Submitted ${reqId} for approval`, 'Status=Incomplete', 'Status=Pending approval');
    emitGuide('requisition-submitted');
    showToast('success', 'Waiting for approval', `${reqId} is Pending approval. Switch to the Approver role. The requester cannot approve it.`);
  };

  const approveRequisition = (reqId: string) => {
    const req = requisitions.find((r) => r.id === reqId);
    if (!req) return;
    const block = sodBlock(req.createdByRole, req.totalAmount);
    if (block) {
      showToast('warning', 'Approval stopped', block);
      return;
    }
    setRequisitions((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: 'Approved' } : r)));
    addAuditLog('Procurement', 'Object Data Update', 'PurchaseRequisitionVO', reqId, `Approver approved ${reqId}`, 'Status=Pending approval', 'Status=Approved');
    emitGuide('requisition-approved');
    showToast('success', 'Request approved', `${reqId} can now become a purchase order.`);
  };

  const createPOFromRequisition = (reqId: string, supplierName?: string): PurchaseOrder | null => {
    const req = requisitions.find((r) => r.id === reqId);
    if (!req) return null;
    if (req.status !== 'Approved') {
      showToast('warning', 'Not approved yet', 'Only an approved request can become a purchase order.');
      return null;
    }
    if (currentUser.roleId === 'approver') {
      showToast('warning', 'Wrong role', 'The approver should not also raise the purchase order. Switch to Buyer.');
      return null;
    }
    const chosen = suppliers.find((s) => s.name === (supplierName || req.lines[0]?.supplierName)) ?? suppliers[0];
    if (!chosen.authorized) {
      showToast('warning', 'Supplier not approved', `${chosen.name} is not an approved supplier. Pick Sharma Traders or Patel Papers.`);
      return null;
    }
    const nextNum = simpleId('PO', 201, purchaseOrders.map((o) => o.id));
    const po: PurchaseOrder = {
      id: nextNum,
      procurementBU: COMPANY.bu,
      requisitioningBU: req.bu,
      soldToLegalEntity: COMPANY.legalEntity,
      billToBU: COMPANY.bu,
      supplier: chosen.name,
      supplierSite: chosen.site,
      supplierContact: chosen.contact,
      buyer: currentUser.name,
      status: 'Incomplete',
      creationDate: todayDate(),
      currency: 'INR',
      paymentTerms: chosen.paymentTerms,
      shipToLocation: COMPANY.shipTo,
      billToLocation: COMPANY.billTo,
      description: req.description,
      requisitionId: req.id,
      createdByRole: currentUser.roleId,
      orderedAmount: req.totalAmount,
      taxAmount: 0,
      totalAmount: req.totalAmount,
      lines: req.lines.map((l) => ({
        lineNumber: l.lineNumber,
        itemCode: l.itemCode || items.find((i) => i.description === l.description)?.code,
        description: l.description,
        category: l.category,
        quantity: l.quantity,
        receivedQty: 0,
        invoicedQty: 0,
        uom: l.uom,
        price: l.price,
        amount: l.amount,
        requisitionId: req.id,
      })),
    };
    setPurchaseOrders((prev) => [po, ...prev]);
    setRequisitions((prev) => prev.map((r) => (r.id === reqId ? { ...r, status: 'Converted to PO' } : r)));
    addAuditLog('Procurement', 'Object Data Insert', 'PurchaseOrderHeaderVO', nextNum, `Created ${nextNum} from ${reqId}`, undefined, `Supplier=${chosen.name}`);
    emitGuide('po-created');
    showToast('success', 'Purchase order created', `${nextNum} is Incomplete. Submit it so an approver can open it.`);
    return po;
  };

  const updatePO = (poId: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) => prev.map((po) => (po.id === poId ? { ...po, ...updates } : po)));
  };

  const submitPO = (poId: string) => {
    setPurchaseOrders((prev) => prev.map((po) => (po.id === poId ? { ...po, status: 'Pending Approval', createdByRole: po.createdByRole || currentUser.roleId } : po)));
    addAuditLog('Procurement', 'Object Data Update', 'PurchaseOrderHeaderVO', poId, `Submitted ${poId} for approval`, 'Status=Incomplete', 'Status=Pending Approval');
    emitGuide('po-submitted');
    showToast('success', 'Waiting for approval', `${poId} is Pending Approval. The buyer cannot approve it.`);
  };

  const approvePO = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;
    const block = sodBlock(po.createdByRole, po.orderedAmount);
    if (block) {
      showToast('warning', 'Approval stopped', block);
      return;
    }
    setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? { ...p, status: 'Open' } : p)));
    addAuditLog('Procurement', 'Object Data Update', 'PurchaseOrderHeaderVO', poId, `Approved ${poId}`, 'Status=Pending Approval', 'Status=Open');
    emitGuide('po-approved');
    showToast('success', 'Purchase order is open', `${poId} can now be received at the warehouse.`);
  };

  const createReceipt = (poId: string, qty: number, waybill: string, packingSlip: string): GoodsReceipt | null => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return null;
    if (po.trainingCase) {
      showToast('warning', 'Leave this order as it is', 'PO-10 is the paper case. Receive the office-chair order you created.');
      return null;
    }
    if (!currentUser.canReceive) {
      showToast('warning', 'Wrong role', 'Switch to Warehouse Receiver. The buyer should not also confirm the goods arrived.');
      return null;
    }
    if (po.status !== 'Open') {
      showToast('warning', 'Order is not open', 'Approve the purchase order before receiving goods.');
      return null;
    }
    const line = po.lines[0];
    const remaining = line.quantity - line.receivedQty;
    if (qty <= 0 || qty > remaining + 0.001) {
      showToast('warning', 'Check the quantity', `You can receive up to ${remaining} ${line.uom}.`);
      return null;
    }
    const nextId = simpleId('GRN', 301, receipts.map((r) => r.id));
    const value = Math.round(qty * line.price);
    const receipt: GoodsReceipt = {
      id: nextId,
      poId: po.id,
      requisitionId: po.requisitionId,
      supplier: po.supplier,
      bu: po.procurementBU,
      transactionDate: todayDate(),
      waybill: waybill || `BD-${Math.floor(10000 + Math.random() * 89999)}`,
      packingSlip: packingSlip || `PS-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedBy: currentUser.name,
      lines: [{ lineNumber: 1, description: line.description, quantityReceived: qty, uom: line.uom }],
    };
    setReceipts((prev) => [receipt, ...prev]);
    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id !== poId) return p;
        const updated = p.lines.map((l, idx) => (idx === 0 ? { ...l, receivedQty: l.receivedQty + qty } : l));
        const done = updated.every((l) => l.receivedQty >= l.quantity);
        return { ...p, lines: updated, status: done ? 'Closed for Receiving' : p.status };
      })
    );
    const matched = items.find((i) => i.code === line.itemCode || i.description === line.description);
    const toStock = !!matched && matched.standardCost > 0;
    postJournal('Purchasing', `Receipt ${nextId}: ${qty} ${line.uom} of ${line.description}`, [
      { segment: ACCT.inspection, debit: value, credit: 0 },
      { segment: ACCT.grni, debit: 0, credit: value },
    ]);
    postJournal(toStock ? 'Inventory' : 'Purchasing', toStock ? `Delivered ${line.description} into stock` : `Service received: ${line.description}`, [
      { segment: toStock ? ACCT.inventory : ACCT.expense, debit: value, credit: 0 },
      { segment: ACCT.inspection, debit: 0, credit: value },
    ]);
    if (matched) {
      setItems((prev) => prev.map((it) => (it.code === matched.code ? { ...it, onHandQty: it.onHandQty + qty } : it)));
    }
    addAuditLog('Procurement', 'Object Data Insert', 'ReceiptHeaderVO', nextId, `Received ${qty} ${line.uom} against ${poId}`, undefined, `Value=${value}`);
    emitGuide('receipt-created');
    showToast('success', 'Goods received', `${nextId} posted. Dr Receiving Inspection ₹${value.toLocaleString('en-IN')}, Cr GR/IR ₹${value.toLocaleString('en-IN')}. Then into stock.`);
    return receipt;
  };

  const createAPInvoice = (data: {
    supplier: string;
    poId?: string;
    amount: number;
    description: string;
    dueDate: string;
    quantity?: number;
    unitPrice?: number;
  }): APInvoice | null => {
    if (!currentUser.canCreateInvoice) {
      showToast('warning', 'Wrong role', 'Switch to AP Accountant. The person who receives goods should not also enter the supplier bill.');
      return null;
    }
    const po = data.poId ? purchaseOrders.find((p) => p.id === data.poId) : undefined;
    const sup = suppliers.find((s) => s.name === data.supplier) ?? suppliers[0];
    const line = po?.lines[0];
    const qty = data.quantity ?? line?.quantity ?? 1;
    const price = data.unitPrice ?? (line ? line.price : data.amount / Math.max(qty, 1));
    const taxable = Math.round(qty * price);
    const gst = splitGst(taxable, sup.state || COMPANY.state);
    const openReceived = line ? line.receivedQty - line.invoicedQty : 0;
    let matchStatus: APInvoice['matchStatus'] = 'Unmatched (No PO)';
    let status: APInvoice['status'] = 'Needs Revalidation';
    let holdReason = '';
    if (po && line) {
      const qtyBad = qty - openReceived > 0.001;
      const priceBad = Math.abs(price - line.price) > 0.01;
      if (qtyBad && priceBad) {
        matchStatus = 'Qty Variance';
        status = 'On Hold';
        holdReason = `Quantity and price do not match the order. Order price ₹${line.price}. Received and not yet billed: ${openReceived} ${line.uom}.`;
      } else if (qtyBad) {
        matchStatus = 'Qty Variance';
        status = 'On Hold';
        holdReason = `Bill is for ${qty} ${line.uom}. Only ${openReceived} ${line.uom} were received and not yet billed.`;
      } else if (priceBad) {
        matchStatus = 'Price Variance';
        status = 'On Hold';
        holdReason = `Bill price is ₹${price}. Purchase order price is ₹${line.price}.`;
      } else {
        matchStatus = 'Matched (3-Way)';
        status = 'Validated';
      }
    }
    const invId = simpleId('BILL', 401, apInvoices.map((i) => i.id));
    const due = data.dueDate || dueDateFrom(todayDate(), sup.paymentTerms);
    const inv: APInvoice = {
      id: invId,
      bu: COMPANY.bu,
      supplier: sup.name,
      supplierSite: sup.site,
      poId: data.poId,
      receiptId: receipts.find((r) => r.poId === data.poId)?.id,
      invoiceDate: todayDate(),
      dueDate: due,
      daysOverdue: daysPastDue(due),
      currency: 'INR',
      amount: gst.gross,
      unpaidAmount: gst.gross,
      status,
      matchStatus,
      postedToLedger: false,
      description: data.description,
      createdBy: currentUser.name,
      createdByRole: currentUser.roleId,
      quantity: qty,
      unitPrice: price,
      taxableAmount: taxable,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      holdReason,
      holdReleased: false,
    };
    setApInvoices((prev) => [inv, ...prev]);
    if (matchStatus === 'Matched (3-Way)' && po && line) {
      setPurchaseOrders((prev) =>
        prev.map((p) =>
          p.id === po.id ? { ...p, lines: p.lines.map((l, i) => (i === 0 ? { ...l, invoicedQty: l.invoicedQty + qty } : l)) } : p
        )
      );
      postJournal('Payables', `${invId} clears GR/IR for ${line.description}`, [
        { segment: ACCT.grni, debit: taxable, credit: 0 },
        ...gstLines(gst, 'input'),
        { segment: ACCT.ap, debit: 0, credit: gst.gross },
      ]);
      setApInvoices((prev) => prev.map((i) => (i.id === invId ? { ...i, postedToLedger: true } : i)));
      emitGuide('ap-invoice-matched');
      showToast('success', '3-way match passed', `${invId}: quantity and price agree. Dr GR/IR ₹${taxable.toLocaleString('en-IN')}, Dr GST, Cr Accounts Payable ₹${gst.gross.toLocaleString('en-IN')}.`);
    } else {
      emitGuide('ap-invoice-held');
      showToast('warning', 'Bill is on hold', holdReason || 'There is no purchase order. It cannot be paid until an approver releases it.');
    }
    addAuditLog('Payables', 'Object Data Insert', 'APInvoiceVO', invId, `Created ${invId} (${matchStatus})`, undefined, `Gross=${gst.gross}`);
    return { ...inv, postedToLedger: matchStatus === 'Matched (3-Way)' };
  };

  const validateAPInvoice = (invId: string) => {
    const inv = apInvoices.find((i) => i.id === invId);
    if (!inv) return;
    if (inv.status === 'On Hold' && !inv.holdReleased) {
      showToast('warning', 'Still on hold', 'A mismatch cannot be validated away. An approver must release the hold, or correct the bill.');
      return;
    }
    setApInvoices((prev) => prev.map((i) => (i.id === invId ? { ...i, status: 'Validated' } : i)));
    showToast('success', 'Validated', `${invId} is validated.`);
  };

  const releaseInvoiceHold = (invId: string) => {
    const inv = apInvoices.find((i) => i.id === invId);
    if (!inv) return;
    const block = sodBlock(inv.createdByRole, inv.amount);
    if (block) {
      showToast('warning', 'Cannot release', block);
      return;
    }
    setApInvoices((prev) => prev.map((i) => (i.id === invId ? { ...i, status: 'Validated', holdReleased: true } : i)));
    addAuditLog('Payables', 'Object Data Update', 'APInvoiceVO', invId, `Hold released on ${invId}`, inv.holdReason, 'Hold released');
    showToast('info', 'Hold released', `${invId} can now be paid. Releasing a real mismatch is an audit point — record why.`);
  };

  const postAPInvoiceToLedger = (invId: string) => {
    const inv = apInvoices.find((i) => i.id === invId);
    if (!inv || inv.postedToLedger) return;
    if (inv.status === 'On Hold' && !inv.holdReleased) {
      showToast('warning', 'Not posted', 'Held bills are not posted and cannot be paid.');
      return;
    }
    const taxable = inv.taxableAmount ?? inv.amount;
    const gst = { cgst: inv.cgst || 0, sgst: inv.sgst || 0, igst: inv.igst || 0 };
    if (inv.matchStatus === 'Matched (3-Way)') {
      postJournal('Payables', `${invId} clears GR/IR`, [
        { segment: ACCT.grni, debit: taxable, credit: 0 },
        ...gstLines(gst, 'input'),
        { segment: ACCT.ap, debit: 0, credit: inv.amount },
      ]);
    } else {
      postJournal('Payables', `${invId} expense (no clean 3-way match)`, [
        { segment: ACCT.expense, debit: taxable, credit: 0 },
        ...gstLines(gst, 'input'),
        { segment: ACCT.ap, debit: 0, credit: inv.amount },
      ]);
    }
    setApInvoices((prev) => prev.map((i) => (i.id === invId ? { ...i, postedToLedger: true } : i)));
    showToast('success', 'Posted', `${invId} is now in the ledger.`);
  };

  const createAPPayment = (data: {
    supplier: string;
    disbursementBank: string;
    paymentMethod: string;
    paymentProcessProfile: string;
    invoiceIds: string[];
  }): APPayment | null => {
    if (!currentUser.canCreatePayment) {
      showToast('warning', 'Wrong role', 'Switch to Cashier. The person who enters the bill should not pay it.');
      return null;
    }
    const target = apInvoices.filter((i) => data.invoiceIds.includes(i.id));
    if (target.length === 0) return null;
    const blocked = target.find((i) => i.status === 'On Hold' || i.status === 'Needs Revalidation' || (i.matchStatus !== 'Matched (3-Way)' && !i.holdReleased));
    if (blocked) {
      showToast('warning', 'Cannot pay this bill', `${blocked.id} is ${blocked.status}. Held or unmatched bills stay unpaid until an approver releases them.`);
      return null;
    }
    const sameRole = target.find((i) => i.createdByRole && i.createdByRole === currentUser.roleId);
    if (sameRole) {
      showToast('warning', 'Segregation of duties', 'You cannot pay a bill you created. Switch role.');
      return null;
    }
    const totalPaid = target.reduce((s, i) => s + i.unpaidAmount, 0);
    const payId = simpleId('PAY', 501, apPayments.map((x) => x.id));
    const sup = suppliers.find((s) => s.name === data.supplier) ?? suppliers[0];
    const payment: APPayment = {
      id: payId,
      bu: COMPANY.bu,
      supplier: sup.name,
      supplierSite: sup.site,
      paymentDate: todayDate(),
      type: 'Manual',
      disbursementBank: data.disbursementBank || COMPANY.bank,
      currency: 'INR',
      paymentMethod: data.paymentMethod || 'NEFT',
      paymentProcessProfile: data.paymentProcessProfile || COMPANY.paymentProfile,
      amount: totalPaid,
      invoiceIds: data.invoiceIds,
      status: 'Negotiable',
      createdBy: currentUser.name,
    };
    setApPayments((prev) => [payment, ...prev]);
    setApInvoices((prev) => prev.map((inv) => (data.invoiceIds.includes(inv.id) ? { ...inv, unpaidAmount: 0, status: 'Paid' } : inv)));
    postJournal('Payables', `Payment ${payId} to ${sup.name}`, [
      { segment: ACCT.ap, debit: totalPaid, credit: 0 },
      { segment: ACCT.bank, debit: 0, credit: totalPaid },
    ]);
    addAuditLog('Payables', 'Object Data Insert', 'PaymentVO', payId, `Paid ₹${totalPaid.toFixed(2)} to ${sup.name}`, undefined, data.invoiceIds.join(','));
    emitGuide('ap-payment-created');
    showToast('success', 'Payment made', `Dr Accounts Payable ₹${totalPaid.toLocaleString('en-IN')}, Cr Bank ₹${totalPaid.toLocaleString('en-IN')}.`);
    return payment;
  };

  const createSalesOrder = (data: {
    customer: string;
    orderType: string;
    paymentTerms: string;
    itemCode: string;
    quantity: number;
    unitPrice: number;
  }): SalesOrder => {
    const cust = customers.find((c) => c.name === data.customer) ?? customers[0];
    const item = items.find((i) => i.code === data.itemCode || i.description === data.itemCode) ?? items[0];
    const soId = `SO-${Math.floor(2000 + Math.random() * 7000)}`;
    const total = data.quantity * data.unitPrice;
    const creditExceeded = total > cust.creditLimit;
    const so: SalesOrder = {
      id: soId,
      bu: COMPANY.bu,
      customer: cust.name,
      billToAccount: cust.account,
      shipToAddress: cust.shipToAddress,
      orderType: data.orderType || 'Standard',
      orderedDate: todayDate(),
      paymentTerms: data.paymentTerms || cust.paymentTerms,
      status: creditExceeded ? 'On Hold' : 'Draft',
      totalAmount: total,
      currency: 'INR',
      lines: [
        {
          lineNumber: 1,
          itemCode: item.code,
          description: item.description,
          quantity: data.quantity,
          uom: item.uom,
          unitPrice: data.unitPrice,
          amount: total,
          fulfillmentStatus: 'Awaiting Pick',
        },
      ],
    };
    setSalesOrders((prev) => [so, ...prev]);
    addAuditLog('Order Management', 'Object Data Insert', 'SalesOrderVO', soId, `Created ${soId} for ${cust.name}`, undefined, `Status=${so.status}`);
    if (creditExceeded) showToast('warning', 'Credit hold', `${soId} is On Hold. ₹${total.toLocaleString('en-IN')} is above ${cust.name}'s limit of ₹${cust.creditLimit.toLocaleString('en-IN')}.`);
    else showToast('success', 'Sales order saved', `${soId} is a draft for ${data.quantity} ${item.uom} of ${item.description}.`);
    return so;
  };

  const submitSalesOrder = (soId: string) => {
    const so = salesOrders.find((s) => s.id === soId);
    if (so?.status === 'On Hold') {
      showToast('warning', 'Still on hold', 'Raise the credit limit or reduce the order before it can be picked.');
      return;
    }
    setSalesOrders((prev) => prev.map((s) => (s.id === soId ? { ...s, status: 'Awaiting Shipping' } : s)));
    emitGuide('so-submitted');
    showToast('success', 'Order accepted', `${soId} is awaiting shipping. Revenue is not recorded yet.`);
  };

  const createPickWaveAndConfirm = (soId: string): Shipment | null => {
    const so = salesOrders.find((s) => s.id === soId);
    if (!so || so.status === 'On Hold') return null;
    const shipId = `SHIP-${Math.floor(30 + Math.random() * 800)}`;
    const shipment: Shipment = {
      id: shipId,
      salesOrderId: so.id,
      customer: so.customer,
      shipFromOrg: COMPANY.invOrg,
      shipToLocation: so.shipToAddress,
      shippingMethod: 'Blue Dart Surface',
      waybill: `BD-${Math.floor(100000 + Math.random() * 899999)}`,
      billOfLading: `BOL-${Math.floor(100000 + Math.random() * 899999)}`,
      initialShipDate: todayDate(),
      status: 'Staged',
      packingSlipGenerated: false,
      lines: so.lines.map((l) => ({
        lineNumber: l.lineNumber,
        itemCode: l.itemCode,
        description: l.description,
        uom: l.uom,
        requestedQty: l.quantity,
        shippedQty: l.quantity,
      })),
    };
    setShipments((prev) => [shipment, ...prev]);
    setSalesOrders((prev) => prev.map((s) => (s.id === soId ? { ...s, status: 'Picked', lines: s.lines.map((l) => ({ ...l, fulfillmentStatus: 'Staged' })) } : s)));
    emitGuide('pick-confirmed');
    showToast('success', 'Picked', `The warehouse picked the goods. Shipment ${shipId} is staged. Nothing is sold until you ship.`);
    return shipment;
  };

  const confirmShipment = (shipmentId: string, shippingMethod: string, waybill: string): ARTransaction | null => {
    const shp = shipments.find((s) => s.id === shipmentId);
    if (!shp || shp.status === 'Confirmed') return null;
    const so = salesOrders.find((s) => s.id === shp.salesOrderId);
    const cust = customers.find((c) => c.name === shp.customer) ?? customers[0];
    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId
          ? { ...s, status: 'Confirmed', packingSlipGenerated: true, shippingMethod: shippingMethod || 'Blue Dart Surface', waybill, billOfLading: s.billOfLading || `BOL-${waybill}` }
          : s
      )
    );
    setSalesOrders((prev) =>
      prev.map((s) => (s.id === shp.salesOrderId ? { ...s, status: 'Shipped', lines: s.lines.map((l) => ({ ...l, fulfillmentStatus: 'Shipped' })) } : s))
    );
    shp.lines.forEach((line) => {
      setItems((prev) => prev.map((it) => (it.code === line.itemCode ? { ...it, onHandQty: it.onHandQty - line.shippedQty } : it)));
    });
    const taxable = so?.totalAmount ?? shp.lines.reduce((s, l) => s + l.shippedQty * 50000, 0);
    const gst = splitGst(taxable, cust.state);
    let cogs = 0;
    shp.lines.forEach((line) => {
      const item = items.find((i) => i.code === line.itemCode);
      cogs += line.shippedQty * (item?.standardCost ?? 0);
    });
    if (cogs > 0) {
      postJournal('Inventory', `Cost of ${shp.lines.map((l) => l.description).join(', ')} shipped`, [
        { segment: ACCT.cogs, debit: cogs, credit: 0 },
        { segment: ACCT.inventory, debit: 0, credit: cogs },
      ]);
    }
    const due = dueDateFrom(todayDate(), so?.paymentTerms || cust.paymentTerms);
    const txId = `AR-${Math.floor(200 + Math.random() * 700)}`;
    const arTx: ARTransaction = {
      id: txId,
      bu: COMPANY.bu,
      transactionSource: 'Order Management',
      transactionType: 'INVOICE',
      salesOrderId: shp.salesOrderId,
      shipmentId: shp.id,
      customer: cust.name,
      customerNumber: cust.number,
      transactionDate: todayDate(),
      dueDate: due,
      daysPastDue: 0,
      paymentTerms: so?.paymentTerms ?? cust.paymentTerms,
      currency: 'INR',
      taxableAmount: taxable,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      originalAmount: gst.gross,
      creditedAmount: 0,
      receiptApplied: 0,
      balanceDue: gst.gross,
      status: 'Complete',
      postedToLedger: true,
      lines: (so?.lines ?? []).map((l) => ({
        lineNumber: l.lineNumber,
        itemCode: l.itemCode,
        description: l.description,
        uom: l.uom,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        amount: l.amount,
      })),
    };
    setArTransactions((prev) => [arTx, ...prev]);
    postJournal('Receivables', `${txId} — control of the goods passed to ${cust.name}`, [
      { segment: ACCT.ar, debit: gst.gross, credit: 0 },
      { segment: ACCT.revenue, debit: 0, credit: taxable },
      ...gstLines(gst, 'output'),
    ]);
    addAuditLog('Inventory', 'Object Data Update', 'ShipmentVO', shipmentId, `Shipped ${shipmentId}. Invoice ${txId}. Packing slip and bill of lading prepared.`, 'Status=Staged', 'Status=Confirmed');
    emitGuide('ship-confirmed');
    showToast('success', 'Shipped', `Revenue is recorded now because the customer has the goods (Ind AS 115). Invoice ${txId}. Due ${due}.`);
    return arTx;
  };

  const postARTransactionToLedger = (txId: string) => {
    const tx = arTransactions.find((t) => t.id === txId);
    if (!tx || tx.postedToLedger) return;
    const taxable = tx.taxableAmount ?? tx.originalAmount;
    postJournal('Receivables', `AR invoice ${txId}`, [
      { segment: ACCT.ar, debit: tx.originalAmount, credit: 0 },
      { segment: ACCT.revenue, debit: 0, credit: taxable },
      ...gstLines({ cgst: tx.cgst || 0, sgst: tx.sgst || 0, igst: tx.igst || 0 }, 'output'),
    ]);
    setArTransactions((prev) => prev.map((t) => (t.id === txId ? { ...t, postedToLedger: true } : t)));
    showToast('success', 'Posted', `${txId} is in the ledger.`);
  };

  const createCreditMemo = (txId: string, amount: number, reason: string) => {
    const tx = arTransactions.find((t) => t.id === txId);
    if (!tx) return;
    setArTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, creditedAmount: t.creditedAmount + amount, balanceDue: Math.max(0, t.balanceDue - amount) } : t))
    );
    postJournal('Receivables', `Credit note on ${txId}: ${reason}`, [
      { segment: ACCT.revenue, debit: amount, credit: 0 },
      { segment: ACCT.ar, debit: 0, credit: amount },
    ]);
    showToast('info', 'Credit note', `Reduced ${txId} by ₹${amount.toLocaleString('en-IN')}.`);
  };

  const createARReceipt = (data: { customer: string; receiptMethod: string; amount: number; applyToInvoiceId?: string }): ARReceipt => {
    const rcptId = `RCPT-${Math.floor(600 + Math.random() * 300)}`;
    let applied = 0;
    const appliedIds: string[] = [];
    if (data.applyToInvoiceId) {
      const target = arTransactions.find((t) => t.id === data.applyToInvoiceId);
      if (target) {
        applied = Math.min(data.amount, target.balanceDue);
        appliedIds.push(target.id);
        setArTransactions((prev) =>
          prev.map((t) =>
            t.id === target.id
              ? { ...t, receiptApplied: t.receiptApplied + applied, balanceDue: Math.max(0, t.balanceDue - applied), status: t.balanceDue - applied <= 0 ? 'Closed' : t.status }
              : t
          )
        );
      }
    }
    const unapplied = data.amount - applied;
    const receipt: ARReceipt = {
      id: rcptId,
      bu: COMPANY.bu,
      customer: data.customer,
      receiptMethod: data.receiptMethod,
      receiptDate: todayDate(),
      currency: 'INR',
      amount: data.amount,
      appliedAmount: applied,
      unappliedAmount: unapplied,
      appliedInvoiceIds: appliedIds,
      status: applied > 0 && unapplied === 0 ? 'Applied' : applied > 0 ? 'Confirmed' : 'Unapplied',
    };
    setArReceipts((prev) => [receipt, ...prev]);
    const lines: Jel[] = [{ segment: ACCT.bank, debit: data.amount, credit: 0 }];
    if (applied > 0) lines.push({ segment: ACCT.ar, debit: 0, credit: applied });
    if (unapplied > 0) lines.push({ segment: ACCT.unapplied, debit: 0, credit: unapplied });
    postJournal('Receivables', applied > 0 ? `Receipt ${rcptId} applied to ${appliedIds.join(', ')}` : `Receipt ${rcptId} left unapplied`, lines);
    if (applied > 0) emitGuide('ar-receipt-applied');
    else emitGuide('ar-receipt-unapplied');
    showToast(
      'success',
      applied > 0 ? 'Receipt applied' : 'Receipt left unapplied',
      applied > 0
        ? `Dr Bank ₹${data.amount.toLocaleString('en-IN')}, Cr Accounts Receivable ₹${applied.toLocaleString('en-IN')}.`
        : `The cash is in the bank, but no invoice was closed. Cr Unapplied receipts ₹${unapplied.toLocaleString('en-IN')}.`
    );
    return receipt;
  };

  const reconcileBankLine = (lineId: string, receiptId: string) => {
    setBankLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, matchedReceiptId: receiptId } : l)));
    emitGuide('bank-reconciled');
    showToast('success', 'Bank line matched', 'This does not post a new entry. It agrees the bank statement to a receipt already in the books.');
  };

  const createManualJournal = (description: string, debitAccount: string, creditAccount: string, amount: number) => {
    postJournal('Manual', description, [
      { segment: debitAccount, debit: amount, credit: 0 },
      { segment: creditAccount, debit: 0, credit: amount },
    ]);
    addAuditLog('General Accounting', 'Object Data Insert', 'JournalEntryVO', description, `Manual journal ₹${amount}`, undefined, `Dr ${debitAccount} Cr ${creditAccount}`);
    showToast('success', 'Journal posted', `Posted to ${COMPANY.ledger}.`);
  };

  const scheduleNewProcess = (reportType: ScheduledJob['reportType'], params: Record<string, string>): ScheduledJob => {
    const names: Record<ScheduledJob['reportType'], { name: string; desc: string }> = {
      TrialBalance: { name: 'Trial Balance Report', desc: 'Does the ledger balance?' },
      SupplierAging: { name: 'Supplier Balance Aging Report', desc: 'Unpaid supplier bills by age' },
      ARAging: { name: 'Aging - 4 Bucket Report', desc: 'Unpaid customer bills by age' },
      PayablesAging: { name: 'Payables Invoice Aging Report', desc: 'Unpaid supplier bills by age' },
    };
    const job: ScheduledJob = {
      processId: String(Math.floor(2445405 + Math.random() * 9000)),
      name: names[reportType].name,
      description: names[reportType].desc,
      status: 'Succeeded',
      submittedBy: currentUser.name,
      submissionTime: nowTimestamp(),
      parameters: params,
      reportType,
    };
    setScheduledJobs((prev) => [job, ...prev]);
    showToast('success', 'Report ready', `${job.name} finished.`);
    return job;
  };

  const toggleAuditObject = (obj: string) => setAuditEnabledObjects((prev) => ({ ...prev, [obj]: !prev[obj] }));
  const markNotificationRead = (id: string) => setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setItems(INITIAL_ITEMS);
    setCart([]);
    setRequisitions(INITIAL_REQUISITIONS);
    setPurchaseOrders(INITIAL_POS);
    setReceipts(INITIAL_RECEIPTS);
    setApInvoices(INITIAL_AP_INVOICES);
    setApPayments(INITIAL_AP_PAYMENTS);
    setSalesOrders(INITIAL_SALES_ORDERS);
    setShipments(INITIAL_SHIPMENTS);
    setArTransactions(INITIAL_AR_TRANSACTIONS);
    setArReceipts(INITIAL_AR_RECEIPTS);
    setBankLines(INITIAL_BANK_LINES);
    setGlAccounts(INITIAL_GL_ACCOUNTS);
    setJournals(INITIAL_JOURNALS);
    setScheduledJobs(INITIAL_SCHEDULED_JOBS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    showToast('info', 'Demo reset', 'The office is back to the start of the class.');
  };

  return (
    <ERPContext.Provider
      value={{
        isSignedIn, currentUser, signIn, signOut, switchUser, currentRoute, selectedId, activeSpringboardTab,
        setActiveSpringboardTab, navigate, favorites, toggleFavorite, teachingMode, setTeachingMode, activeLabId,
        setActiveLabId, suppliers, customers, items, cart, addToCart, removeFromCart, clearCart, requisitions,
        createRequisitionFromCart, submitRequisition, approveRequisition, purchaseOrders, createPOFromRequisition,
        updatePO, submitPO, approvePO, receipts, createReceipt, apInvoices, createAPInvoice, validateAPInvoice,
        releaseInvoiceHold, postAPInvoiceToLedger, apPayments, createAPPayment, salesOrders, createSalesOrder,
        submitSalesOrder, shipments, createPickWaveAndConfirm, confirmShipment, arTransactions, postARTransactionToLedger,
        createCreditMemo, arReceipts, createARReceipt, bankLines, reconcileBankLine, glAccounts, journals,
        createManualJournal, scheduledJobs, scheduleNewProcess, auditLogs, auditEnabledObjects, toggleAuditObject,
        inventoryAdjustments, notifications, markNotificationRead, toasts, showToast, dismissToast, resetDemoData,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const ctx = useContext(ERPContext);
  if (!ctx) throw new Error('useERP must be used within ERPProvider');
  return ctx;
};
