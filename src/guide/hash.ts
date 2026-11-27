import { ModuleRoute } from '../types/erp';

const ROUTES = new Set<string>([
  'home',
  'orientation',
  'purchase_requisitions',
  'create_noncatalog',
  'edit_requisition',
  'manage_requisitions',
  'purchase_orders',
  'process_requisitions',
  'edit_po',
  'manage_orders',
  'my_receipts',
  'create_receipt',
  'payables_invoices',
  'create_ap_invoice',
  'payables_payments',
  'create_ap_payment',
  'order_management',
  'create_sales_order',
  'inventory_management',
  'pick_waves',
  'manage_shipments',
  'edit_shipment',
  'receivables_billing',
  'review_ar_transaction',
  'accounts_receivable',
  'create_ar_receipt',
  'bank_reconciliation',
  'general_accounting',
  'detail_balances',
  'journals',
  'scheduled_processes',
  'audit_reports',
  'ca_audit_lab',
]);

export function formatHash(route: string, id?: string | null, stepId?: string | null) {
  let body = route;
  if (id) body += `/${id}`;
  if (stepId) body += `|step=${stepId}`;
  return `#${body}`;
}

export function parseHash(raw = typeof window === 'undefined' ? '' : window.location.hash): {
  route: ModuleRoute;
  id: string | null;
  stepId: string | null;
} | null {
  const body = raw.replace(/^#/, '');
  if (!body) return null;
  const [path, ...flags] = body.split('|');
  const [route, id] = path.split('/');
  if (!ROUTES.has(route)) return null;
  const stepFlag = flags.find((f) => f.startsWith('step='));
  return {
    route: route as ModuleRoute,
    id: id || null,
    stepId: stepFlag ? stepFlag.slice(5) : null,
  };
}
