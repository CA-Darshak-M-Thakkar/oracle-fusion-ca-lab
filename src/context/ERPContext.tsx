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
} from '../types/erp';
import { GOOGLE_SHEET_WEBHOOK_URL } from '../config/attendance';
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
} from '../data/seedData';

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
  // Auth & Navigation
  isSignedIn: boolean;
  currentUser: UserProfile;
  signIn: (
    userId: string,
    studentDetails?: { email: string; name: string; mobile: string; wroNo: string }
  ) => void;
  signOut: () => void;
  switchUser: (userId: string) => void;

  currentRoute: ModuleRoute;
  selectedId: string | null;
  activeSpringboardTab: SpringboardTab;
  setActiveSpringboardTab: (tab: SpringboardTab) => void;
  navigate: (route: ModuleRoute, id?: string | null) => void;
  favorites: { label: string; route: ModuleRoute }[];
  toggleFavorite: (label: string, route: ModuleRoute) => void;

  // Teaching Mode
  teachingMode: boolean;
  setTeachingMode: (val: boolean) => void;
  activeLabId: string | null;
  setActiveLabId: (id: string | null) => void;

  // Master Data
  suppliers: Supplier[];
  customers: Customer[];
  items: ItemMaster[];

  // P2P Data & Actions
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

  receipts: GoodsReceipt[];
  createReceipt: (poId: string, qty: number, waybill: string, packingSlip: string) => GoodsReceipt | null;

  apInvoices: APInvoice[];
  createAPInvoice: (data: {
    supplier: string;
    poId?: string;
    amount: number;
    description: string;
    dueDate: string;
  }) => APInvoice;
  validateAPInvoice: (invId: string) => void;
  postAPInvoiceToLedger: (invId: string) => void;

  apPayments: APPayment[];
  createAPPayment: (data: {
    supplier: string;
    disbursementBank: string;
    paymentMethod: string;
    paymentProcessProfile: string;
    invoiceIds: string[];
  }) => APPayment | null;

  // O2C Data & Actions
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

  // GL & Reports & Audit
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

  // UI Helpers
  toasts: ToastMessage[];
  showToast: (type: ToastMessage['type'], title: string, message: string) => void;
  dismissToast: (id: string) => void;
  resetDemoData: () => void;
}

const STORAGE_KEY = 'oracle_fusion_ca_sim_inr_v2';

const ERPContext = createContext<ERPContextType | undefined>(undefined);

function nowTimestamp() {
  const d = new Date();
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
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

  const [isSignedIn, setIsSignedIn] = useState<boolean>(saved?.isSignedIn ?? false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(saved?.currentUser ?? DEMO_USERS[0]);
  const [currentRoute, setCurrentRoute] = useState<ModuleRoute>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeSpringboardTab, setActiveSpringboardTab] = useState<SpringboardTab>('Procurement');
  const [teachingMode, setTeachingMode] = useState<boolean>(true);
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
  const [arTransactions, setArTransactions] = useState<ARTransaction[]>(
    saved?.arTransactions ?? INITIAL_AR_TRANSACTIONS
  );
  const [arReceipts, setArReceipts] = useState<ARReceipt[]>(saved?.arReceipts ?? INITIAL_AR_RECEIPTS);

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
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    saved?.notifications ?? INITIAL_NOTIFICATIONS
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isSignedIn,
          currentUser,
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
          glAccounts,
          journals,
          scheduledJobs,
          auditLogs,
          auditEnabledObjects,
          notifications,
        })
      );
    } catch {
      // ignore quota errors
    }
  }, [
    isSignedIn,
    currentUser,
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
    glAccounts,
    journals,
    scheduledJobs,
    auditLogs,
    auditEnabledObjects,
    notifications,
  ]);

  const showToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addAuditLog = useCallback(
    (
      product: string,
      eventType: AuditLog['eventType'],
      businessObject: string,
      recordId: string,
      description: string,
      oldValue?: string,
      newValue?: string
    ) => {
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

  const postGL = useCallback(
    (
      source: JournalEntry['source'],
      description: string,
      debitSeg: string,
      creditSeg: string,
      amount: number
    ) => {
      setGlAccounts((prev) =>
        prev.map((acc) => {
          if (acc.segment === debitSeg) {
            return { ...acc, debits: acc.debits + amount };
          }
          if (acc.segment === creditSeg) {
            return { ...acc, credits: acc.credits + amount };
          }
          return acc;
        })
      );

      const dAcc = glAccounts.find((a) => a.segment === debitSeg);
      const cAcc = glAccounts.find((a) => a.segment === creditSeg);

      const je: JournalEntry = {
        id: `JE-${Math.floor(1000 + Math.random() * 9000)}`,
        batchName: `${source} AutoPost`,
        source,
        date: todayDate(),
        description,
        status: 'Posted',
        lines: [
          {
            accountSegment: debitSeg,
            accountDescription: dAcc?.description ?? debitSeg,
            debit: amount,
            credit: 0,
          },
          {
            accountSegment: creditSeg,
            accountDescription: cAcc?.description ?? creditSeg,
            debit: 0,
            credit: amount,
          },
        ],
      };
      setJournals((prev) => [je, ...prev]);
    },
    [glAccounts]
  );

  const navigate = useCallback((route: ModuleRoute, id: string | null = null) => {
    setCurrentRoute(route);
    setSelectedId(id);
  }, []);

  const signIn = (
    userId: string,
    studentDetails?: { email: string; name: string; mobile: string; wroNo: string }
  ) => {
    const base = DEMO_USERS.find((u) => u.id === userId) ?? DEMO_USERS[0];
    let userProfile: UserProfile = { ...base };

    if (studentDetails) {
      const cleanEmail = studentDetails.email.trim().toLowerCase();
      const cleanName = studentDetails.name.trim();
      const parts = cleanName.split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
          : cleanName.slice(0, 2).toUpperCase();

      userProfile = {
        ...base,
        id: cleanEmail,
        name: cleanName,
        email: cleanEmail,
        mobile: studentDetails.mobile.trim(),
        wroNo: studentDetails.wroNo.trim().toUpperCase(),
        initials,
      };

      // Log attendance to Google Sheet if webhook URL is configured
      if (GOOGLE_SHEET_WEBHOOK_URL) {
        fetch(GOOGLE_SHEET_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            name: userProfile.name,
            email: userProfile.email,
            mobile: userProfile.mobile,
            wroNo: userProfile.wroNo,
          }),
        }).catch(() => {
          // Non-blocking: do not prevent student from entering the lab
        });
      }
    }

    setCurrentUser(userProfile);
    setIsSignedIn(true);
    setCurrentRoute('home');
    showToast(
      'success',
      'Signed In',
      `Welcome, ${userProfile.name}${userProfile.wroNo ? ` (${userProfile.wroNo})` : ''}`
    );
  };

  const signOut = () => {
    setIsSignedIn(false);
    setCurrentRoute('home');
  };

  const switchUser = (userId: string) => {
    const found = DEMO_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser((prev) => ({
        ...prev,
        role: found.role,
        department: found.department,
        canApprovePO: found.canApprovePO,
        canCreatePayment: found.canCreatePayment,
      }));
      showToast('info', 'Role Switched', `Operating as ${currentUser.name} — ${found.role}`);
    }
  };

  const toggleFavorite = (label: string, route: ModuleRoute) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.route === route);
      if (exists) return prev.filter((f) => f.route !== route);
      return [...prev, { label, route }];
    });
  };

  // Cart & Requisitions
  const addToCart = (line: RequisitionLine) => {
    setCart((prev) => [...prev, { line }]);
    showToast('success', 'Added to Cart', `${line.description} (₹${line.amount.toFixed(2)}) added to cart.`);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const createRequisitionFromCart = (description: string, justification: string, submitImmediately: boolean) => {
    const num = Math.floor(28 + Math.random() * 900);
    const id = `NR00${num}`;
    const lines = cart.map((c, idx) => ({ ...c.line, lineNumber: idx + 1 }));
    const totalAmount = lines.reduce((sum, l) => sum + l.amount, 0);
    const req: Requisition = {
      id,
      description: description || lines[0]?.description || 'Noncatalog Request',
      bu: 'US1 Business Unit',
      requester: currentUser.name,
      preparer: currentUser.name,
      justification: justification || 'Business operational requirement',
      status: submitImmediately ? 'Approved' : 'Incomplete',
      createdAt: todayDate(),
      totalAmount,
      currency: 'INR',
      lines,
    };
    setRequisitions((prev) => [req, ...prev]);
    setCart([]);
    addAuditLog(
      'Procurement',
      'Object Data Insert',
      'PurchaseRequisitionVO',
      id,
      `Created Requisition ${id} (${req.status}) for ₹${totalAmount.toFixed(2)}`,
      undefined,
      `Status=${req.status}, Amount=${totalAmount}`
    );
    if (submitImmediately) {
      setNotifications((prev) => [
        {
          id: `NOTIF-${Date.now()}`,
          title: `Requisition ${id} Approved`,
          message: `Requisition ${id} (₹${totalAmount.toFixed(2)}) was auto-approved and is ready for PO creation.`,
          timestamp: 'Just now',
          read: false,
          targetRoute: 'process_requisitions',
        },
        ...prev,
      ]);
    }
    return req;
  };

  const submitRequisition = (reqId: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'Approved' } : r))
    );
    addAuditLog(
      'Procurement',
      'Object Data Update',
      'PurchaseRequisitionVO',
      reqId,
      `Submitted & Approved Requisition ${reqId}`,
      'Status=Incomplete',
      'Status=Approved'
    );
    showToast('success', 'Requisition Submitted', `Requisition ${reqId} has been submitted and approved.`);
  };

  const approveRequisition = (reqId: string) => {
    setRequisitions((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'Approved' } : r))
    );
    addAuditLog(
      'Procurement',
      'Object Data Update',
      'PurchaseRequisitionVO',
      reqId,
      `Manager approved Requisition ${reqId}`,
      'Status=Pending approval',
      'Status=Approved'
    );
    showToast('success', 'Approved', `Requisition ${reqId} is now Approved.`);
  };

  // Purchase Orders
  const createPOFromRequisition = (reqId: string, supplierName?: string): PurchaseOrder | null => {
    const req = requisitions.find((r) => r.id === reqId);
    if (!req) return null;
    const nextNum = String(Math.max(12, ...purchaseOrders.map((p) => parseInt(p.id, 10) || 10)) + 1);
    const chosenSupplier =
      suppliers.find((s) => s.name === (supplierName || req.lines[0]?.supplierName)) ?? suppliers[0];

    const po: PurchaseOrder = {
      id: nextNum,
      procurementBU: 'US1 Business Unit',
      requisitioningBU: req.bu,
      soldToLegalEntity: 'Flipkart India private limited',
      billToBU: 'US1 Business Unit',
      supplier: chosenSupplier.name,
      supplierSite: chosenSupplier.site,
      supplierContact: chosenSupplier.contact,
      buyer: currentUser.name,
      status: 'Incomplete',
      creationDate: todayDate(),
      currency: req.currency,
      paymentTerms: chosenSupplier.paymentTerms,
      shipToLocation: 'US-Newyork',
      billToLocation: 'New York AJ',
      description: req.description,
      requisitionId: req.id,
      orderedAmount: req.totalAmount,
      taxAmount: 0,
      totalAmount: req.totalAmount,
      lines: req.lines.map((l) => ({
        lineNumber: l.lineNumber,
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
    setRequisitions((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: 'Converted to PO' } : r))
    );
    addAuditLog(
      'Procurement',
      'Object Data Insert',
      'PurchaseOrderHeaderVO',
      `PO ${nextNum}`,
      `Created Purchase Order ${nextNum} from Requisition ${reqId}`,
      undefined,
      `Status=Incomplete, Supplier=${chosenSupplier.name}, Total=${po.totalAmount}`
    );
    return po;
  };

  const updatePO = (poId: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) => prev.map((po) => (po.id === poId ? { ...po, ...updates } : po)));
    addAuditLog(
      'Procurement',
      'Object Data Update',
      'PurchaseOrderHeaderVO',
      `PO ${poId}`,
      `Updated Purchase Order ${poId} details`,
      undefined,
      JSON.stringify(updates)
    );
  };

  const submitPO = (poId: string) => {
    setPurchaseOrders((prev) =>
      prev.map((po) => (po.id === poId ? { ...po, status: 'Open' } : po))
    );
    addAuditLog(
      'Procurement',
      'Object Data Update',
      'PurchaseOrderHeaderVO',
      `PO ${poId}`,
      `Submitted Purchase Order ${poId} for approval; Status became Open`,
      'Status=Incomplete',
      'Status=Open'
    );
    setNotifications((prev) => [
      {
        id: `NOTIF-${Date.now()}`,
        title: `Purchase Order ${poId} Open`,
        message: `PO ${poId} has been approved and is ready for Receiving.`,
        timestamp: 'Just now',
        read: false,
        targetRoute: 'my_receipts',
      },
      ...prev,
    ]);
    showToast('success', 'Confirmation', `The document (Purchase Order) ${poId} was submitted and is now Open.`);
  };

  // Receiving
  const createReceipt = (poId: string, qty: number, waybill: string, packingSlip: string): GoodsReceipt | null => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return null;
    const nextReceiptId = String(Math.max(103, ...receipts.map((r) => parseInt(r.id, 10) || 100)) + 1);
    const receipt: GoodsReceipt = {
      id: nextReceiptId,
      poId: po.id,
      requisitionId: po.requisitionId,
      supplier: po.supplier,
      bu: po.procurementBU,
      transactionDate: todayDate(),
      waybill: waybill || `WB-${Math.floor(10000 + Math.random() * 90000)}`,
      packingSlip: packingSlip || `PS-${Math.floor(1000 + Math.random() * 9000)}`,
      receivedBy: currentUser.name,
      lines: po.lines.map((l) => ({
        lineNumber: l.lineNumber,
        description: l.description,
        quantityReceived: qty,
        uom: l.uom,
      })),
    };
    setReceipts((prev) => [receipt, ...prev]);
    setPurchaseOrders((prev) =>
      prev.map((p) => {
        if (p.id !== poId) return p;
        const updatedLines = p.lines.map((l) => ({
          ...l,
          receivedQty: l.receivedQty + qty,
        }));
        const allReceived = updatedLines.every((l) => l.receivedQty >= l.quantity);
        return {
          ...p,
          status: allReceived ? 'Closed for Receiving' : p.status,
          lines: updatedLines,
        };
      })
    );
    addAuditLog(
      'Procurement',
      'Object Data Insert',
      'ReceiptHeaderVO',
      `GRN ${nextReceiptId}`,
      `Created Receipt ${nextReceiptId} for PO ${poId} (Qty: ${qty})`,
      undefined,
      `PO=${poId}, Qty=${qty}`
    );
    showToast('success', 'Confirmation', `You created the following receipt number: ${nextReceiptId}`);
    return receipt;
  };

  // AP Invoices
  const createAPInvoice = (data: {
    supplier: string;
    poId?: string;
    amount: number;
    description: string;
    dueDate: string;
  }): APInvoice => {
    const invId = `Inv${Math.floor(100 + Math.random() * 899)}`;
    const po = data.poId ? purchaseOrders.find((p) => p.id === data.poId) : undefined;
    const grn = data.poId ? receipts.find((r) => r.poId === data.poId) : undefined;
    const sup = suppliers.find((s) => s.name === data.supplier) ?? suppliers[0];

    let matchStatus: APInvoice['matchStatus'] = 'Unmatched (No PO)';
    if (po) {
      if (!grn) {
        matchStatus = 'Qty Variance';
      } else if (Math.abs(data.amount - po.totalAmount) > 0.01) {
        matchStatus = 'Price Variance';
      } else {
        matchStatus = 'Matched (3-Way)';
      }
    }

    const inv: APInvoice = {
      id: invId,
      bu: 'US1 Business Unit',
      supplier: sup.name,
      supplierSite: sup.site,
      poId: data.poId,
      receiptId: grn?.id,
      invoiceDate: todayDate(),
      dueDate: data.dueDate || todayDate(),
      daysOverdue: 0,
      currency: 'INR',
      amount: data.amount,
      unpaidAmount: data.amount,
      status: matchStatus === 'Matched (3-Way)' ? 'Validated' : 'Needs Revalidation',
      matchStatus,
      postedToLedger: false,
      description: data.description,
      createdBy: currentUser.name,
    };
    setApInvoices((prev) => [inv, ...prev]);
    addAuditLog(
      'Payables',
      'Object Data Insert',
      'APInvoiceVO',
      invId,
      `Created AP Invoice ${invId} for ${sup.name} (₹${data.amount.toFixed(2)}) [${matchStatus}]`,
      undefined,
      `Amount=${data.amount}, Match=${matchStatus}`
    );
    showToast(
      matchStatus === 'Matched (3-Way)' ? 'success' : 'warning',
      `Invoice ${invId} Created`,
      `Match Status: ${matchStatus}`
    );
    return inv;
  };

  const validateAPInvoice = (invId: string) => {
    setApInvoices((prev) =>
      prev.map((inv) => (inv.id === invId ? { ...inv, status: 'Validated' } : inv))
    );
    addAuditLog(
      'Payables',
      'Object Data Update',
      'APInvoiceVO',
      invId,
      `Validated AP Invoice ${invId}`,
      'Status=Needs Revalidation',
      'Status=Validated'
    );
    showToast('success', 'Invoice Validated', `AP Invoice ${invId} is now Validated.`);
  };

  const postAPInvoiceToLedger = (invId: string) => {
    const inv = apInvoices.find((i) => i.id === invId);
    if (!inv || inv.postedToLedger) return;
    setApInvoices((prev) =>
      prev.map((i) => (i.id === invId ? { ...i, postedToLedger: true } : i))
    );
    postGL('Payables', `AP Invoice ${invId} — ${inv.supplier}`, '5000', '2001', inv.amount);
    showToast('success', 'Posted to Ledger', `Accounting entries posted to General Ledger for ${invId}.`);
  };

  const createAPPayment = (data: {
    supplier: string;
    disbursementBank: string;
    paymentMethod: string;
    paymentProcessProfile: string;
    invoiceIds: string[];
  }): APPayment | null => {
    const targetInvs = apInvoices.filter((i) => data.invoiceIds.includes(i.id));
    if (targetInvs.length === 0) return null;
    const totalPaid = targetInvs.reduce((s, i) => s + i.unpaidAmount, 0);
    const payId = String(Math.floor(2335 + Math.random() * 7000));
    const sup = suppliers.find((s) => s.name === data.supplier) ?? suppliers[0];

    const payment: APPayment = {
      id: payId,
      bu: 'US1 Business Unit',
      supplier: sup.name,
      supplierSite: sup.site,
      paymentDate: todayDate(),
      type: 'Quick',
      disbursementBank: data.disbursementBank,
      currency: 'INR',
      paymentMethod: data.paymentMethod,
      paymentProcessProfile: data.paymentProcessProfile,
      amount: totalPaid,
      invoiceIds: data.invoiceIds,
      status: 'Negotiable',
      createdBy: currentUser.name,
    };

    setApPayments((prev) => [payment, ...prev]);
    setApInvoices((prev) =>
      prev.map((inv) =>
        data.invoiceIds.includes(inv.id)
          ? { ...inv, unpaidAmount: 0, status: 'Paid' }
          : inv
      )
    );
    postGL('Payables', `AP Payment ${payId} — ${sup.name}`, '2001', '0001', totalPaid);
    addAuditLog(
      'Payables',
      'Object Data Insert',
      'PaymentVO',
      payId,
      `Created Payment ${payId} for ₹${totalPaid.toFixed(2)} INR to ${sup.name}`,
      undefined,
      `Invoices=${data.invoiceIds.join(',')}, Amount=${totalPaid}`
    );
    showToast('success', 'Confirmation', `Payment ${payId} for ₹${totalPaid.toFixed(2)} INR has been created.`);
    return payment;
  };

  // O2C: Sales Orders
  const createSalesOrder = (data: {
    customer: string;
    orderType: string;
    paymentTerms: string;
    itemCode: string;
    quantity: number;
    unitPrice: number;
  }): SalesOrder => {
    const cust = customers.find((c) => c.name === data.customer) ?? customers[0];
    const item = items.find((i) => i.code === data.itemCode) ?? items[0];
    const soId = `SO-${Math.floor(1005 + Math.random() * 8900)}`;
    const total = data.quantity * data.unitPrice;
    const creditExceeded = total > cust.creditLimit;

    const so: SalesOrder = {
      id: soId,
      bu: 'EXA_BU',
      customer: cust.name,
      billToAccount: cust.account,
      shipToAddress: cust.shipToAddress,
      orderType: data.orderType || 'EXA BILL SHIP',
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
    addAuditLog(
      'Order Management',
      'Object Data Insert',
      'SalesOrderVO',
      soId,
      `Created Sales Order ${soId} for ${cust.name} (₹${total.toFixed(2)})`,
      undefined,
      `Status=${so.status}, CreditLimit=${cust.creditLimit}`
    );
    if (creditExceeded) {
      showToast('warning', 'Credit Hold Applied', `${soId} exceeds ${cust.name}'s credit limit (₹${cust.creditLimit.toLocaleString()}).`);
    } else {
      showToast('success', 'Sales Order Created', `Sales Order ${soId} saved as Draft.`);
    }
    return so;
  };

  const submitSalesOrder = (soId: string) => {
    setSalesOrders((prev) =>
      prev.map((so) => (so.id === soId ? { ...so, status: 'Awaiting Shipping' } : so))
    );
    addAuditLog(
      'Order Management',
      'Object Data Update',
      'SalesOrderVO',
      soId,
      `Submitted Sales Order ${soId} -> Awaiting Shipping`,
      'Status=Draft',
      'Status=Awaiting Shipping'
    );
    showToast('success', 'Order Submitted', `Sales Order ${soId} is now Awaiting Shipping.`);
  };

  const createPickWaveAndConfirm = (soId: string): Shipment | null => {
    const so = salesOrders.find((s) => s.id === soId);
    if (!so) return null;
    const shipId = String(Math.floor(290019 + Math.random() * 9000));
    const shipment: Shipment = {
      id: shipId,
      salesOrderId: so.id,
      customer: so.customer,
      shipFromOrg: 'EXA_INV_ORG',
      shipToLocation: so.shipToAddress,
      shippingMethod: 'Fed EX-Parcel-Truck',
      waybill: `FDX-${Math.floor(1000000 + Math.random() * 8999999)}`,
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
    setSalesOrders((prev) =>
      prev.map((s) =>
        s.id === soId
          ? {
              ...s,
              status: 'Picked',
              lines: s.lines.map((l) => ({ ...l, fulfillmentStatus: 'Staged' })),
            }
          : s
      )
    );
    addAuditLog(
      'Inventory',
      'Object Data Insert',
      'ShipmentVO',
      shipId,
      `Pick Wave Released & Pick Confirmed for ${soId} -> Shipment ${shipId} Staged`,
      undefined,
      `Shipment=${shipId}, Status=Staged`
    );
    showToast('success', 'Pick Confirmed', `Pick Wave released & Pick Slips confirmed. Shipment ${shipId} is Staged.`);
    return shipment;
  };

  const confirmShipment = (shipmentId: string, shippingMethod: string, waybill: string): ARTransaction | null => {
    const shp = shipments.find((s) => s.id === shipmentId);
    if (!shp) return null;

    setShipments((prev) =>
      prev.map((s) =>
        s.id === shipmentId
          ? { ...s, status: 'Confirmed', packingSlipGenerated: true, shippingMethod, waybill }
          : s
      )
    );

    const so = salesOrders.find((s) => s.id === shp.salesOrderId);
    setSalesOrders((prev) =>
      prev.map((s) =>
        s.id === shp.salesOrderId
          ? {
              ...s,
              status: 'Shipped',
              lines: s.lines.map((l) => ({ ...l, fulfillmentStatus: 'Shipped' })),
            }
          : s
      )
    );

    // Deduct Inventory On-Hand
    shp.lines.forEach((line) => {
      setItems((prev) =>
        prev.map((it) =>
          it.code === line.itemCode
            ? { ...it, onHandQty: Math.max(0, it.onHandQty - line.shippedQty) }
            : it
        )
      );
    });

    // Auto-create AR Invoice
    const cust = customers.find((c) => c.name === shp.customer) ?? customers[0];
    const txId = String(Math.floor(2050110 + Math.random() * 9000));
    const lines = so
      ? so.lines.map((l) => ({
          lineNumber: l.lineNumber,
          itemCode: l.itemCode,
          description: l.description,
          uom: l.uom,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
        }))
      : shp.lines.map((l) => ({
          lineNumber: l.lineNumber,
          itemCode: l.itemCode,
          description: l.description,
          uom: l.uom,
          quantity: l.shippedQty,
          unitPrice: 120,
          amount: l.shippedQty * 120,
        }));
    const total = lines.reduce((s, l) => s + l.amount, 0);

    const arTx: ARTransaction = {
      id: txId,
      bu: 'EXA_BU',
      transactionSource: 'Order Management',
      transactionType: 'INVOICE',
      salesOrderId: shp.salesOrderId,
      shipmentId: shp.id,
      customer: cust.name,
      customerNumber: cust.number,
      transactionDate: todayDate(),
      dueDate: todayDate(),
      daysPastDue: 0,
      paymentTerms: so?.paymentTerms ?? cust.paymentTerms,
      currency: 'INR',
      originalAmount: total,
      creditedAmount: 0,
      receiptApplied: 0,
      balanceDue: total,
      status: 'Complete',
      postedToLedger: true,
      lines,
    };

    setArTransactions((prev) => [arTx, ...prev]);
    postGL('Receivables', `AR AutoInvoice ${txId} — ${cust.name}`, '1210', '4000', total);

    addAuditLog(
      'Inventory',
      'Object Data Update',
      'ShipmentVO',
      shipmentId,
      `Ship Confirmed ${shipmentId}; Packing Slip generated & AR Invoice ${txId} created`,
      'Status=Staged',
      `Status=Confirmed, ARInvoice=${txId}`
    );
    showToast('success', 'Ship Confirmed', `Shipment ${shipmentId} confirmed! Packing Slip & AR Invoice ${txId} generated.`);
    return arTx;
  };

  const postARTransactionToLedger = (txId: string) => {
    const tx = arTransactions.find((t) => t.id === txId);
    if (!tx || tx.postedToLedger) return;
    setArTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, postedToLedger: true } : t))
    );
    postGL('Receivables', `AR Invoice ${txId} — ${tx.customer}`, '1210', '4000', tx.originalAmount);
    showToast('success', 'Posted to Ledger', `AR Invoice ${txId} posted to General Ledger.`);
  };

  const createCreditMemo = (txId: string, amount: number, reason: string) => {
    const tx = arTransactions.find((t) => t.id === txId);
    if (!tx) return;
    setArTransactions((prev) =>
      prev.map((t) =>
        t.id === txId
          ? {
              ...t,
              creditedAmount: t.creditedAmount + amount,
              balanceDue: Math.max(0, t.balanceDue - amount),
            }
          : t
      )
    );
    postGL('Receivables', `Credit Memo on ${txId}: ${reason}`, '4000', '1210', amount);
    addAuditLog(
      'Receivables',
      'Object Data Insert',
      'ARTransactionVO',
      `CM-${txId}`,
      `Issued Credit Memo of ₹${amount.toFixed(2)} on Invoice ${txId}: ${reason}`,
      `Balance=${tx.balanceDue}`,
      `Balance=${Math.max(0, tx.balanceDue - amount)}`
    );
    showToast('info', 'Credit Memo Issued', `Credited ₹${amount.toFixed(2)} against Invoice ${txId}.`);
  };

  const createARReceipt = (data: {
    customer: string;
    receiptMethod: string;
    amount: number;
    applyToInvoiceId?: string;
  }): ARReceipt => {
    const rcptId = `RCPT-${Math.floor(505 + Math.random() * 900)}`;
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
              ? {
                  ...t,
                  receiptApplied: t.receiptApplied + applied,
                  balanceDue: Math.max(0, t.balanceDue - applied),
                  status: t.balanceDue - applied <= 0 ? 'Closed' : t.status,
                }
              : t
          )
        );
      }
    }

    const receipt: ARReceipt = {
      id: rcptId,
      bu: 'EXA_BU',
      customer: data.customer,
      receiptMethod: data.receiptMethod,
      receiptDate: todayDate(),
      currency: 'INR',
      amount: data.amount,
      appliedAmount: applied,
      unappliedAmount: data.amount - applied,
      appliedInvoiceIds: appliedIds,
      status: applied > 0 ? 'Applied' : 'Unapplied',
    };

    setArReceipts((prev) => [receipt, ...prev]);
    postGL('Receivables', `Customer Receipt ${rcptId} — ${data.customer}`, '0001', '1210', data.amount);
    addAuditLog(
      'Receivables',
      'Object Data Insert',
      'ARTransactionVO',
      rcptId,
      `Created AR Receipt ${rcptId} (₹${data.amount.toFixed(2)}) from ${data.customer}`,
      undefined,
      `Applied=${applied}, Invoices=${appliedIds.join(',') || 'None'}`
    );
    showToast('success', 'Receipt Created', `Receipt ${rcptId} recorded (₹${data.amount.toFixed(2)}).`);
    return receipt;
  };

  const createManualJournal = (description: string, debitAccount: string, creditAccount: string, amount: number) => {
    postGL('Manual', description, debitAccount, creditAccount, amount);
    addAuditLog(
      'General Accounting',
      'Object Data Insert',
      'JournalEntryVO',
      `JE-${todayDate()}`,
      `Posted manual journal: ${description} (₹${amount.toFixed(2)})`,
      undefined,
      `Dr ${debitAccount} / Cr ${creditAccount}`
    );
    showToast('success', 'Journal Posted', `Manual journal entry posted to US_Primary_Ledger.`);
  };

  const scheduleNewProcess = (reportType: ScheduledJob['reportType'], params: Record<string, string>): ScheduledJob => {
    const names: Record<ScheduledJob['reportType'], { name: string; desc: string }> = {
      TrialBalance: { name: 'Trial Balance Report', desc: 'Generates Ledger Trial Balance by Account Segment' },
      SupplierAging: { name: 'Supplier Balance Aging Report', desc: 'Lists unpaid supplier invoices as on a specific date' },
      ARAging: { name: 'Aging - 4 Bucket Report', desc: 'Categorizes open customer receivables into 4 aging buckets' },
      PayablesAging: { name: 'Payables Invoice Aging Report', desc: 'Detailed Payables aging analysis by supplier site' },
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
    showToast('success', 'Process Submitted', `Process ${job.processId} (${job.name}) completed with status Succeeded.`);
    return job;
  };

  const toggleAuditObject = (obj: string) => {
    setAuditEnabledObjects((prev) => ({ ...prev, [obj]: !prev[obj] }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

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
    setGlAccounts(INITIAL_GL_ACCOUNTS);
    setJournals(INITIAL_JOURNALS);
    setScheduledJobs(INITIAL_SCHEDULED_JOBS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentRoute('home');
    showToast('info', 'Demo Data Reset', 'All transactions and balances restored to initial AICITSS lab state.');
  };

  return (
    <ERPContext.Provider
      value={{
        isSignedIn,
        currentUser,
        signIn,
        signOut,
        switchUser,
        currentRoute,
        selectedId,
        activeSpringboardTab,
        setActiveSpringboardTab,
        navigate,
        favorites,
        toggleFavorite,
        teachingMode,
        setTeachingMode,
        activeLabId,
        setActiveLabId,
        suppliers,
        customers,
        items,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        requisitions,
        createRequisitionFromCart,
        submitRequisition,
        approveRequisition,
        purchaseOrders,
        createPOFromRequisition,
        updatePO,
        submitPO,
        receipts,
        createReceipt,
        apInvoices,
        createAPInvoice,
        validateAPInvoice,
        postAPInvoiceToLedger,
        apPayments,
        createAPPayment,
        salesOrders,
        createSalesOrder,
        submitSalesOrder,
        shipments,
        createPickWaveAndConfirm,
        confirmShipment,
        arTransactions,
        postARTransactionToLedger,
        createCreditMemo,
        arReceipts,
        createARReceipt,
        glAccounts,
        journals,
        createManualJournal,
        scheduledJobs,
        scheduleNewProcess,
        auditLogs,
        auditEnabledObjects,
        toggleAuditObject,
        inventoryAdjustments,
        notifications,
        markNotificationRead,
        toasts,
        showToast,
        dismissToast,
        resetDemoData,
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
