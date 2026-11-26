import React, { useState } from 'react';
import { X, Home, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { ModuleRoute } from '../types/erp';

interface NavigatorDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface NavGroup {
  name: string;
  items: { label: string; route: ModuleRoute }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Procurement',
    items: [
      { label: 'Purchase Requisitions', route: 'purchase_requisitions' },
      { label: 'Process Requisitions', route: 'process_requisitions' },
      { label: 'Purchase Orders', route: 'purchase_orders' },
      { label: 'My Receipts', route: 'my_receipts' },
    ],
  },
  {
    name: 'Payables',
    items: [
      { label: 'Invoices', route: 'payables_invoices' },
      { label: 'Payments', route: 'payables_payments' },
    ],
  },
  {
    name: 'Order Management',
    items: [
      { label: 'Order Management', route: 'order_management' },
      { label: 'Create Sales Order', route: 'create_sales_order' },
    ],
  },
  {
    name: 'Supply Chain Execution',
    items: [
      { label: 'Inventory Management', route: 'inventory_management' },
      { label: 'Pick Waves & Confirm Picks', route: 'pick_waves' },
      { label: 'Manage Shipments', route: 'manage_shipments' },
    ],
  },
  {
    name: 'Receivables',
    items: [
      { label: 'Billing', route: 'receivables_billing' },
      { label: 'Accounts Receivable', route: 'accounts_receivable' },
    ],
  },
  {
    name: 'General Accounting',
    items: [
      { label: 'General Accounting Dashboard', route: 'general_accounting' },
      { label: 'Inquire on Detail Balances', route: 'detail_balances' },
      { label: 'Journals', route: 'journals' },
    ],
  },
  {
    name: 'Tools',
    items: [
      { label: 'Scheduled Processes', route: 'scheduled_processes' },
      { label: 'Audit Reports', route: 'audit_reports' },
    ],
  },
  {
    name: 'Risk Management',
    items: [
      { label: 'CA Audit Lab & Case Studies', route: 'ca_audit_lab' },
    ],
  },
];

export const NavigatorDrawer: React.FC<NavigatorDrawerProps> = ({ open, onClose }) => {
  const { navigate } = useERP();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Procurement: true,
    Payables: true,
    'Order Management': true,
    Tools: true,
    'Risk Management': true,
  });

  if (!open) return null;

  const toggleGroup = (name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleNav = (route: ModuleRoute) => {
    navigate(route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex no-print">
      <div className="w-80 bg-white h-full shadow-2xl border-r border-[#D6DFE6] flex flex-col animate-in slide-in-from-left duration-150">
        <div className="px-4 py-3 border-b border-[#E6ECF0] flex items-center justify-between bg-[#F8FAFC]">
          <button
            onClick={onClose}
            className="text-[#00688C] hover:bg-[#EBF4F8] p-1 rounded flex items-center gap-1 text-[12px] font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Close
          </button>
          <span className="text-[12px] font-semibold text-[#00688C]">Navigator</span>
          <button onClick={onClose} className="text-[#5E6C7A] hover:text-[#161513]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <button
            onClick={() => handleNav('home')}
            className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#312D2A] hover:bg-[#EDF6FA] flex items-center gap-2.5 border-b border-[#F0F3F5]"
          >
            <Home className="w-4 h-4 text-[#5E6C7A]" />
            Home
          </button>

          {NAV_GROUPS.map((grp) => {
            const isOpen = !!expanded[grp.name];
            return (
              <div key={grp.name} className="border-b border-[#F0F3F5]">
                <button
                  onClick={() => toggleGroup(grp.name)}
                  className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-[#312D2A] hover:bg-[#F5F8FA] flex items-center justify-between"
                >
                  <span>{grp.name}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#5E6C7A]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#5E6C7A]" />
                  )}
                </button>
                {isOpen && (
                  <div className="bg-[#FAFBFD] pb-1">
                    {grp.items.map((item) => (
                      <button
                        key={item.route}
                        onClick={() => handleNav(item.route)}
                        className="w-full text-left pl-8 pr-4 py-1.5 text-[12.5px] text-[#00688C] hover:bg-[#E6F2F8] transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-black/25" onClick={onClose} />
    </div>
  );
};
