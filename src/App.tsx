import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { LoginScreen } from './components/LoginScreen';
import { TopHeader } from './components/TopHeader';
import { NavigatorDrawer } from './components/NavigatorDrawer';
import { HomeSpringboard } from './components/HomeSpringboard';
import { CATeachingBar } from './components/CATeachingBar';
import { RequisitionsModule } from './components/p2p/RequisitionsModule';
import { PurchaseOrdersModule } from './components/p2p/PurchaseOrdersModule';
import { ReceiptsModule } from './components/p2p/ReceiptsModule';
import { PayablesModule } from './components/p2p/PayablesModule';
import { OrderManagementModule } from './components/o2c/OrderManagementModule';
import { InventoryShippingModule } from './components/o2c/InventoryShippingModule';
import { ReceivablesModule } from './components/o2c/ReceivablesModule';
import { GeneralAccountingModule } from './components/gl/GeneralAccountingModule';
import { ScheduledProcessesModule } from './components/reports/ScheduledProcessesModule';
import { AuditModule } from './components/audit/AuditModule';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useERP();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full no-print">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-white border border-[#D6DFE6] shadow-lg rounded-[4px] p-3.5 flex items-start gap-2.5 animate-in fade-in duration-150"
        >
          {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0 mt-0.5" />}
          {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-4 h-4 text-[#00688C] shrink-0 mt-0.5" />}
          <div className="flex-1 text-[12px]">
            <div className="font-semibold text-[#161513]">{t.title}</div>
            <div className="text-[#524C46] mt-0.5">{t.message}</div>
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-[#8C847C] hover:text-[#161513]">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

const MainRouter: React.FC = () => {
  const { isSignedIn, currentRoute } = useERP();
  const [navOpen, setNavOpen] = useState(false);

  if (!isSignedIn) {
    return (
      <>
        <LoginScreen />
        <ToastContainer />
      </>
    );
  }

  const renderModule = () => {
    switch (currentRoute) {
      case 'home':
        return <HomeSpringboard />;
      case 'purchase_requisitions':
      case 'create_noncatalog':
      case 'edit_requisition':
      case 'manage_requisitions':
        return <RequisitionsModule />;
      case 'purchase_orders':
      case 'process_requisitions':
      case 'edit_po':
      case 'manage_orders':
        return <PurchaseOrdersModule />;
      case 'my_receipts':
      case 'create_receipt':
        return <ReceiptsModule />;
      case 'payables_invoices':
      case 'create_ap_invoice':
      case 'payables_payments':
      case 'create_ap_payment':
        return <PayablesModule />;
      case 'order_management':
      case 'create_sales_order':
        return <OrderManagementModule />;
      case 'inventory_management':
      case 'pick_waves':
      case 'manage_shipments':
      case 'edit_shipment':
        return <InventoryShippingModule />;
      case 'receivables_billing':
      case 'review_ar_transaction':
      case 'accounts_receivable':
      case 'create_ar_receipt':
        return <ReceivablesModule />;
      case 'general_accounting':
      case 'detail_balances':
      case 'journals':
        return <GeneralAccountingModule />;
      case 'scheduled_processes':
        return <ScheduledProcessesModule />;
      case 'audit_reports':
      case 'ca_audit_lab':
        return <AuditModule />;
      default:
        return <HomeSpringboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopHeader onOpenNavigator={() => setNavOpen(true)} />
      <CATeachingBar />
      <NavigatorDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="flex-1">{renderModule()}</main>
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <ERPProvider>
      <MainRouter />
    </ERPProvider>
  );
}

export default App;
