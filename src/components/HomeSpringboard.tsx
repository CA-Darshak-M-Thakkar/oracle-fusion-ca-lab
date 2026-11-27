import React from 'react';
import {
  ShoppingCart,
  FileText,
  PackageCheck,
  Receipt,
  CreditCard,
  ClipboardList,
  Truck,
  Boxes,
  BarChart3,
  BookOpen,
  CalendarClock,
  ShieldAlert,
  FileSearch,
  UserCheck,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { ModuleRoute, SpringboardTab } from '../types/erp';

const SPRINGBOARD_TABS: SpringboardTab[] = [
  'Me',
  'Procurement',
  'Order Management',
  'Supply Chain Execution',
  'Payables',
  'Receivables',
  'General Accounting',
  'Tools',
  'Risk Management',
];

interface AppTile {
  label: string;
  route: ModuleRoute;
  color: string;
  icon: React.ReactNode;
}

interface QuickAction {
  label: string;
  route: ModuleRoute;
}

const TAB_CONTENT: Record<SpringboardTab, { quickActions: QuickAction[]; apps: AppTile[] }> = {
  Me: {
    quickActions: [
      { label: 'Shop / Create Requisition', route: 'purchase_requisitions' },
      { label: 'My Receipts', route: 'my_receipts' },
      { label: 'CA Audit Lab', route: 'ca_audit_lab' },
      { label: 'Scheduled Processes', route: 'scheduled_processes' },
    ],
    apps: [
      { label: 'Purchase Requisitions', route: 'purchase_requisitions', color: 'bg-[#5CB85C]', icon: <ShoppingCart className="w-6 h-6" /> },
      { label: 'Purchase Orders', route: 'purchase_orders', color: 'bg-[#9C27B0]', icon: <FileText className="w-6 h-6" /> },
      { label: 'Order Management', route: 'order_management', color: 'bg-[#0288D1]', icon: <ClipboardList className="w-6 h-6" /> },
      { label: 'Payables Invoices', route: 'payables_invoices', color: 'bg-[#00897B]', icon: <Receipt className="w-6 h-6" /> },
      { label: 'General Accounting', route: 'general_accounting', color: 'bg-[#E64A19]', icon: <BarChart3 className="w-6 h-6" /> },
      { label: 'Audit Reports', route: 'audit_reports', color: 'bg-[#1976D2]', icon: <FileSearch className="w-6 h-6" /> },
    ],
  },
  Procurement: {
    quickActions: [
      { label: 'Process Requisitions', route: 'process_requisitions' },
      { label: 'Manage Orders', route: 'manage_orders' },
      { label: 'Shop / Noncatalog Request', route: 'create_noncatalog' },
      { label: 'Manage Requisitions', route: 'manage_requisitions' },
      { label: 'Manage Receipts', route: 'my_receipts' },
    ],
    apps: [
      { label: 'Purchase Requisitions', route: 'purchase_requisitions', color: 'bg-[#5CB85C]', icon: <ShoppingCart className="w-6 h-6" /> },
      { label: 'Purchase Orders', route: 'purchase_orders', color: 'bg-[#9C27B0]', icon: <FileText className="w-6 h-6" /> },
      { label: 'My Receipts', route: 'my_receipts', color: 'bg-[#8E24AA]', icon: <PackageCheck className="w-6 h-6" /> },
      { label: 'Process Requisitions', route: 'process_requisitions', color: 'bg-[#3F51B5]', icon: <FileSpreadsheet className="w-6 h-6" /> },
    ],
  },
  'Order Management': {
    quickActions: [
      { label: 'Create Sales Order', route: 'create_sales_order' },
      { label: 'Manage Sales Orders', route: 'order_management' },
      { label: 'Check Inventory & Ship', route: 'inventory_management' },
    ],
    apps: [
      { label: 'Order Management', route: 'order_management', color: 'bg-[#0288D1]', icon: <ClipboardList className="w-6 h-6" /> },
      { label: 'Create Sales Order', route: 'create_sales_order', color: 'bg-[#D84315]', icon: <ShoppingCart className="w-6 h-6" /> },
      { label: 'Inventory Management', route: 'inventory_management', color: 'bg-[#2E7D32]', icon: <Boxes className="w-6 h-6" /> },
    ],
  },
  'Supply Chain Execution': {
    quickActions: [
      { label: 'Create Pick Wave', route: 'pick_waves' },
      { label: 'Manage Shipments', route: 'manage_shipments' },
      { label: 'Inventory Adjustments & Audit', route: 'ca_audit_lab' },
    ],
    apps: [
      { label: 'Inventory Management', route: 'inventory_management', color: 'bg-[#2E7D32]', icon: <Boxes className="w-6 h-6" /> },
      { label: 'Pick Waves', route: 'pick_waves', color: 'bg-[#00897B]', icon: <PackageCheck className="w-6 h-6" /> },
      { label: 'Manage Shipments', route: 'manage_shipments', color: 'bg-[#E65100]', icon: <Truck className="w-6 h-6" /> },
    ],
  },
  Payables: {
    quickActions: [
      { label: 'Create Invoice', route: 'create_ap_invoice' },
      { label: 'Manage Invoices', route: 'payables_invoices' },
      { label: 'Create Payment', route: 'create_ap_payment' },
      { label: 'Supplier Balance Aging', route: 'scheduled_processes' },
    ],
    apps: [
      { label: 'Invoices', route: 'payables_invoices', color: 'bg-[#0277BD]', icon: <Receipt className="w-6 h-6" /> },
      { label: 'Payments', route: 'payables_payments', color: 'bg-[#AD1457]', icon: <CreditCard className="w-6 h-6" /> },
      { label: 'Create Payment', route: 'create_ap_payment', color: 'bg-[#E64A19]', icon: <CreditCard className="w-6 h-6" /> },
    ],
  },
  Receivables: {
    quickActions: [
      { label: 'Manage Transactions', route: 'receivables_billing' },
      { label: 'Create Customer Receipt', route: 'create_ar_receipt' },
      { label: 'Aging - 4 Bucket Report', route: 'scheduled_processes' },
    ],
    apps: [
      { label: 'Billing', route: 'receivables_billing', color: 'bg-[#C2185B]', icon: <Receipt className="w-6 h-6" /> },
      { label: 'Accounts Receivable', route: 'accounts_receivable', color: 'bg-[#00838F]', icon: <CreditCard className="w-6 h-6" /> },
    ],
  },
  'General Accounting': {
    quickActions: [
      { label: 'Inquire on Detail Balances', route: 'detail_balances' },
      { label: 'Manage Journals', route: 'journals' },
      { label: 'Trial Balance Report', route: 'scheduled_processes' },
    ],
    apps: [
      { label: 'General Accounting Dashboard', route: 'general_accounting', color: 'bg-[#E64A19]', icon: <BarChart3 className="w-6 h-6" /> },
      { label: 'Journals', route: 'journals', color: 'bg-[#D84315]', icon: <BookOpen className="w-6 h-6" /> },
      { label: 'Detail Balances', route: 'detail_balances', color: 'bg-[#C62828]', icon: <FileSpreadsheet className="w-6 h-6" /> },
    ],
  },
  Tools: {
    quickActions: [
      { label: 'Schedule New Process', route: 'scheduled_processes' },
      { label: 'View Audit Reports', route: 'audit_reports' },
    ],
    apps: [
      { label: 'Scheduled Processes', route: 'scheduled_processes', color: 'bg-[#5E35B1]', icon: <CalendarClock className="w-6 h-6" /> },
      { label: 'Audit Reports', route: 'audit_reports', color: 'bg-[#1565C0]', icon: <FileSearch className="w-6 h-6" /> },
    ],
  },
  'Risk Management': {
    quickActions: [
      { label: 'Open CA Audit Red Flags', route: 'ca_audit_lab' },
      { label: 'Case Study 9.1 (P2P ABC Ltd.)', route: 'ca_audit_lab' },
      { label: 'Case Study 9.2 (O2C Electronics)', route: 'ca_audit_lab' },
    ],
    apps: [
      { label: 'CA Audit Lab & Case Studies', route: 'ca_audit_lab', color: 'bg-[#C74634]', icon: <ShieldAlert className="w-6 h-6" /> },
      { label: 'Fusion Audit Trail', route: 'audit_reports', color: 'bg-[#1976D2]', icon: <UserCheck className="w-6 h-6" /> },
    ],
  },
};

export const HomeSpringboard: React.FC = () => {
  const {
    currentUser,
    activeSpringboardTab,
    setActiveSpringboardTab,
    navigate,
    requisitions,
    purchaseOrders,
    apInvoices,
    arTransactions,
  } = useERP();

  const content = TAB_CONTENT[activeSpringboardTab];
  const openPOs = purchaseOrders.filter((p) => p.status === 'Open').length;
  const unpaidAP = apInvoices.filter((i) => i.unpaidAmount > 0).length;
  const openAR = arTransactions.filter((t) => t.balanceDue > 0).length;
  const pendingReq = requisitions.filter((r) => r.status === 'Pending approval').length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="oracle-sky-gradient min-h-[calc(100vh-48px)] pb-12">
      <div className="max-w-6xl mx-auto px-6 pt-8">
        {/* Greeting */}
        <h1 className="text-[28px] font-light text-[#1D3549] tracking-tight">
          {greeting}, {currentUser.name}
        </h1>

        {/* Category Tabs */}
        <div data-coach="springboard" className="mt-6 flex max-w-full items-center gap-6 overflow-x-auto border-b border-white/30 pb-2">
          {SPRINGBOARD_TABS.map((tab) => {
            const active = activeSpringboardTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveSpringboardTab(tab)}
                className={`whitespace-nowrap text-[13.5px] pb-2 -mb-[9px] transition-all ${
                  active
                    ? 'text-[#0A2538] font-semibold border-b-2 border-[#0A2538]'
                    : 'text-[#1D3549]/80 hover:text-[#0A2538] font-normal'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Quick Actions + Apps */}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Quick Actions */}
          <div className="md:col-span-4">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#1D3549]/80 mb-3">
              QUICK ACTIONS
            </div>
            <div className="space-y-1.5">
              {content.quickActions.map((qa, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(qa.route)}
                  className="w-full text-left px-3 py-2 rounded-[4px] bg-white/45 hover:bg-white/80 text-[#0F2C40] text-[13px] font-medium flex items-center justify-between transition-colors shadow-sm"
                >
                  <span>{qa.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#00688C]" />
                </button>
              ))}
            </div>
          </div>

          {/* Apps Circular Icons */}
          <div className="md:col-span-8">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#1D3549]/80 mb-4">
              APPS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {content.apps.map((app) => (
                <button
                  key={app.label}
                  onClick={() => navigate(app.route)}
                  className="group flex flex-col items-center text-center focus:outline-none"
                >
                  <div
                    className={`w-16 h-16 rounded-full ${app.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 group-hover:shadow-lg transition-all ring-4 ring-white/40`}
                  >
                    {app.icon}
                  </div>
                  <span className="mt-2.5 text-[12.5px] font-medium text-[#0F2C40] group-hover:underline leading-tight">
                    {app.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Things to Finish / Live Infolets */}
        <div className="mt-10">
          <div className="text-[12px] font-semibold text-[#1D3549] mb-3">Things to Finish & Live ERP Summary</div>
          <div data-coach="things-to-finish" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('manage_requisitions')}
              className="bg-white/90 hover:bg-white rounded-[4px] p-4 text-left shadow-sm border border-white transition-all"
            >
              <div className="text-[11.5px] text-[#5E6C7A] font-medium">Requisitions Pending Approval</div>
              <div className="text-[26px] font-light text-[#00688C] mt-1">{pendingReq}</div>
              <div className="text-[11px] text-[#00688C] mt-1">Click to review & approve →</div>
            </button>
            <button
              onClick={() => navigate('my_receipts')}
              className="bg-white/90 hover:bg-white rounded-[4px] p-4 text-left shadow-sm border border-white transition-all"
            >
              <div className="text-[11.5px] text-[#5E6C7A] font-medium">Open Purchase Orders</div>
              <div className="text-[26px] font-light text-[#2E7D32] mt-1">{openPOs}</div>
              <div className="text-[11px] text-[#00688C] mt-1">Ready for Goods Receipt →</div>
            </button>
            <button
              onClick={() => navigate('payables_invoices')}
              className="bg-white/90 hover:bg-white rounded-[4px] p-4 text-left shadow-sm border border-white transition-all"
            >
              <div className="text-[11.5px] text-[#5E6C7A] font-medium">Unpaid AP Invoices</div>
              <div className="text-[26px] font-light text-[#D97706] mt-1">{unpaidAP}</div>
              <div className="text-[11px] text-[#00688C] mt-1">Validate & Pay Suppliers →</div>
            </button>
            <button
              onClick={() => navigate('accounts_receivable')}
              className="bg-white/90 hover:bg-white rounded-[4px] p-4 text-left shadow-sm border border-white transition-all"
            >
              <div className="text-[11.5px] text-[#5E6C7A] font-medium">Open AR Invoices</div>
              <div className="text-[26px] font-light text-[#C74634] mt-1">{openAR}</div>
              <div className="text-[11px] text-[#C74634] mt-1">Open customer bills →</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
