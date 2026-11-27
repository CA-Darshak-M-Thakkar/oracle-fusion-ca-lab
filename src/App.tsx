import React, { useEffect, useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { LoginScreen } from './components/LoginScreen';
import { TopHeader } from './components/TopHeader';
import { NavigatorDrawer } from './components/NavigatorDrawer';
import { HomeSpringboard } from './components/HomeSpringboard';
import { RequisitionsModule } from './components/p2p/RequisitionsModule';
import { PurchaseOrdersModule } from './components/p2p/PurchaseOrdersModule';
import { ReceiptsModule } from './components/p2p/ReceiptsModule';
import { PayablesModule } from './components/p2p/PayablesModule';
import { OrderManagementModule } from './components/o2c/OrderManagementModule';
import { InventoryShippingModule } from './components/o2c/InventoryShippingModule';
import { ReceivablesModule } from './components/o2c/ReceivablesModule';
import { BankReconciliationModule } from './components/o2c/BankReconciliationModule';
import { GeneralAccountingModule } from './components/gl/GeneralAccountingModule';
import { ScheduledProcessesModule } from './components/reports/ScheduledProcessesModule';
import { AuditModule } from './components/audit/AuditModule';
import { EBSClassicApp } from './components/ebs/EBSClassicApp';
import { OrientationModule } from './components/orientation/OrientationModule';
import { GuideProvider } from './components/guide/GuideLayer';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const FONT_KEY = 'oracle_fusion_font';
const THEME_KEY = 'oracle_fusion_theme';

function applyPrefs(dark: boolean, font: string) {
  const root = document.documentElement;
  root.classList.toggle('dark-theme', dark);
  root.classList.toggle('light-theme', !dark);
  root.setAttribute('data-font', font);
  localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  localStorage.setItem(FONT_KEY, font);
}

const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useERP();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-24 right-4 z-[75] w-full max-w-sm space-y-2">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-start gap-2 rounded border border-slate-500 bg-slate-900 p-3 text-slate-50 shadow-lg">
          {t.type === 'success' && <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-400" />}
          {t.type === 'warning' && <AlertTriangle className="mt-1 h-5 w-5 text-amber-300" />}
          {t.type === 'info' && <Info className="mt-1 h-5 w-5 text-sky-300" />}
          <div className="flex-1 text-base">
            <div className="font-semibold">{t.title}</div>
            <div className="mt-1 leading-snug">{t.message}</div>
          </div>
          <button type="button" onClick={() => dismissToast(t.id)} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

const MainRouter: React.FC<{
  fontScale: string;
  onFont: (v: string) => void;
  dark: boolean;
  onToggleTheme: () => void;
}> = ({ fontScale, onFont, dark, onToggleTheme }) => {
  const { isSignedIn, currentRoute } = useERP();
  const [navOpen, setNavOpen] = useState(false);
  const [uiMode, setUiMode] = useState<'fusion' | 'ebs'>('fusion');

  if (!isSignedIn) {
    return (
      <>
        <LoginScreen fontScale={fontScale} onFont={onFont} dark={dark} onToggleTheme={onToggleTheme} />
        <ToastContainer />
      </>
    );
  }

  if (uiMode === 'ebs') {
    return (
      <>
        <EBSClassicApp onSwitchToFusion={() => setUiMode('fusion')} />
        <ToastContainer />
      </>
    );
  }

  const renderModule = () => {
    switch (currentRoute) {
      case 'orientation':
        return <OrientationModule />;
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
      case 'bank_reconciliation':
        return <BankReconciliationModule />;
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
    <div className="flex min-h-screen flex-col pb-24">
      <TopHeader
        onOpenNavigator={() => {
          setNavOpen(true);
          window.dispatchEvent(new CustomEvent('fusion-guide', { detail: 'navigator-opened' }));
        }}
        onSwitchToEBS={() => setUiMode('ebs')}
        processMapOpen={false}
        onToggleProcessMap={() => undefined}
        darkMode={dark}
        onToggleDarkMode={onToggleTheme}
      />
      <NavigatorDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="flex-1">{renderModule()}</main>
      <ToastContainer />
    </div>
  );
};

export function App() {
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) !== 'light');
  const [fontScale, setFontScale] = useState(() => localStorage.getItem(FONT_KEY) || '125');

  useEffect(() => {
    applyPrefs(dark, fontScale);
  }, [dark, fontScale]);

  return (
    <ERPProvider>
      <GuideProvider>
        <MainRouter
          fontScale={fontScale}
          onFont={setFontScale}
          dark={dark}
          onToggleTheme={() => setDark((v) => !v)}
        />
      </GuideProvider>
    </ERPProvider>
  );
}

export default App;
