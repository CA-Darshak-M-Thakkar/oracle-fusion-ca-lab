import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  FileText,
  PackageCheck,
  Receipt,
  CreditCard,
  ClipboardList,
  Truck,
  BarChart3,
  BookOpen,
  CalendarClock,
  FileSearch,
  ShieldAlert,
  ArrowRight,
  X,
  Keyboard,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { ModuleRoute } from '../types/erp';

interface ProcessFlowMapProps {
  open: boolean;
  onClose: () => void;
}

interface FlowNode {
  step: string;
  title: string;
  subtitle: string;
  accounting: string;
  route: ModuleRoute;
  icon: React.ReactNode;
}

interface CycleDef {
  id: string;
  label: string;
  color: string;
  nodes: FlowNode[];
}

const CYCLES: CycleDef[] = [
  {
    id: 'p2p',
    label: '1. Procure-to-Pay (P2P)',
    color: '#00688C',
    nodes: [
      {
        step: 'Step 1',
        title: 'Purchase Requisition',
        subtitle: 'Request Noncatalog Item & Submit',
        accounting: 'No GL Entry (Internal Request)',
        route: 'purchase_requisitions',
        icon: <ShoppingCart className="w-5 h-5" />,
      },
      {
        step: 'Step 2',
        title: 'Purchase Order (PO)',
        subtitle: 'Process Requisitions → Open PO',
        accounting: 'No GL Entry (Legal Commitment)',
        route: 'process_requisitions',
        icon: <FileText className="w-5 h-5" />,
      },
      {
        step: 'Step 3',
        title: 'Receive Goods (GRN)',
        subtitle: 'My Receipts → Generate GRN',
        accounting: 'Physical Receipt Logged',
        route: 'my_receipts',
        icon: <PackageCheck className="w-5 h-5" />,
      },
      {
        step: 'Step 4',
        title: 'AP Invoice & 3-Way Match',
        subtitle: 'Match PO + GRN + Vendor Bill',
        accounting: 'Dr Expense / Cr AP Liability',
        route: 'payables_invoices',
        icon: <Receipt className="w-5 h-5" />,
      },
      {
        step: 'Step 5',
        title: 'Supplier Payment',
        subtitle: 'Create Payment & Clear Invoice',
        accounting: 'Dr AP Liability / Cr Bank',
        route: 'create_ap_payment',
        icon: <CreditCard className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'o2c',
    label: '2. Order-to-Cash (O2C)',
    color: '#0288D1',
    nodes: [
      {
        step: 'Step 1',
        title: 'Sales Order',
        subtitle: 'Customer Order + Credit Check',
        accounting: 'Credit Limit Hold Control',
        route: 'order_management',
        icon: <ClipboardList className="w-5 h-5" />,
      },
      {
        step: 'Step 2',
        title: 'Pick Wave & Confirm',
        subtitle: 'Reserve & Pick Warehouse Stock',
        accounting: 'Staged for Dispatch',
        route: 'pick_waves',
        icon: <PackageCheck className="w-5 h-5" />,
      },
      {
        step: 'Step 3',
        title: 'Ship Confirm',
        subtitle: 'Packing Slip + AutoInvoice',
        accounting: 'Dr AR / Cr Sales Revenue',
        route: 'manage_shipments',
        icon: <Truck className="w-5 h-5" />,
      },
      {
        step: 'Step 4',
        title: 'Receivables Billing',
        subtitle: 'Balance Details & Credit Memo',
        accounting: 'Verify Customer Open Balance',
        route: 'receivables_billing',
        icon: <Receipt className="w-5 h-5" />,
      },
      {
        step: 'Step 5',
        title: 'Customer Receipt',
        subtitle: 'Collect & Apply Cash to Invoice',
        accounting: 'Dr Bank / Cr AR',
        route: 'create_ar_receipt',
        icon: <CreditCard className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'gl',
    label: '3. GL & Financial Reports',
    color: '#D97706',
    nodes: [
      {
        step: 'Step 1',
        title: 'Detail Balances',
        subtitle: 'Inquire US_Primary_Ledger',
        accounting: 'Live Beginning, Dr, Cr, Ending',
        route: 'detail_balances',
        icon: <BarChart3 className="w-5 h-5" />,
      },
      {
        step: 'Step 2',
        title: 'Journals (SLA)',
        subtitle: 'Trace Subledger & Manual JEs',
        accounting: 'Double-Entry Verification',
        route: 'journals',
        icon: <BookOpen className="w-5 h-5" />,
      },
      {
        step: 'Step 3',
        title: 'Scheduled Processes',
        subtitle: 'Trial Balance & Aging Reports',
        accounting: 'Export CSV & Print PDF',
        route: 'scheduled_processes',
        icon: <CalendarClock className="w-5 h-5" />,
      },
    ],
  },
  {
    id: 'audit',
    label: '4. Fusion Audit & Case Studies',
    color: '#C74634',
    nodes: [
      {
        step: 'Step 1',
        title: 'Audit Reports',
        subtitle: 'Companies Act 2013 Audit Trail',
        accounting: 'Insert / Update / Delete Logs',
        route: 'audit_reports',
        icon: <FileSearch className="w-5 h-5" />,
      },
      {
        step: 'Step 2',
        title: 'CA Audit Lab',
        subtitle: 'Red Flags + Case Studies 9.1 & 9.2',
        accounting: 'P2P, O2C & SoD Investigation',
        route: 'ca_audit_lab',
        icon: <ShieldAlert className="w-5 h-5" />,
      },
    ],
  },
];

export const ProcessFlowMap: React.FC<ProcessFlowMapProps> = ({ open, onClose }) => {
  const { navigate } = useERP();
  const [cycleIdx, setCycleIdx] = useState(0);
  const [nodeIdx, setNodeIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      // Ignore if typing inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setNodeIdx((prev) => (prev + 1) % CYCLES[cycleIdx].nodes.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setNodeIdx((prev) => (prev - 1 + CYCLES[cycleIdx].nodes.length) % CYCLES[cycleIdx].nodes.length);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCycleIdx((prev) => (prev + 1) % CYCLES.length);
        setNodeIdx(0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCycleIdx((prev) => (prev - 1 + CYCLES.length) % CYCLES.length);
        setNodeIdx(0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = CYCLES[cycleIdx].nodes[nodeIdx];
        if (target) {
          navigate(target.route);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, cycleIdx, nodeIdx, navigate, onClose]);

  if (!open) return null;

  const activeCycle = CYCLES[cycleIdx];

  return (
    <div className="bg-[#0F172A] text-white border-b border-[#334155] px-5 py-4 shadow-lg no-print">
      <div className="max-w-7xl mx-auto">
        {/* Top Row: Cycle Tabs + Keyboard Hint + Close */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            {CYCLES.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => {
                  setCycleIdx(idx);
                  setNodeIdx(0);
                }}
                className={`px-3 py-1.5 rounded-[4px] text-[12.5px] font-semibold transition-all ${
                  idx === cycleIdx
                    ? 'bg-[#0284C7] text-white shadow'
                    : 'bg-[#1E293B] text-[#CBD5E1] hover:bg-[#334155]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[12px] text-[#94A3B8]">
            <span className="hidden md:inline-flex items-center gap-1.5 bg-[#1E293B] px-2.5 py-1 rounded border border-[#334155]">
              <Keyboard className="w-3.5 h-3.5 text-[#38BDF8]" />
              Use <strong className="text-white">← →</strong> steps, <strong className="text-white">↑ ↓</strong> cycles, <strong className="text-white">Enter</strong> to open
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[#334155] text-[#CBD5E1] hover:text-white"
              title="Close Process Map (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Flowchart Nodes */}
        <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-2 overflow-x-auto pb-1">
          {activeCycle.nodes.map((node, idx) => {
            const active = idx === nodeIdx;
            return (
              <React.Fragment key={node.route}>
                <button
                  onClick={() => {
                    setNodeIdx(idx);
                    navigate(node.route);
                  }}
                  className={`flex-1 min-w-[185px] text-left p-3.5 rounded-[6px] border-2 transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-[#16293D] border-[#38BDF8] ring-2 ring-[#38BDF8]/40 shadow-lg'
                      : 'bg-[#1E293B] border-[#334155] hover:border-[#64748B]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
                        {node.step}
                      </span>
                      <span className={active ? 'text-[#38BDF8]' : 'text-[#94A3B8]'}>{node.icon}</span>
                    </div>
                    <div className="text-[14px] font-semibold text-white leading-snug">{node.title}</div>
                    <div className="text-[11.5px] text-[#CBD5E1] mt-1">{node.subtitle}</div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#334155] text-[11px] font-mono text-[#34D399]">
                    {node.accounting}
                  </div>
                </button>
                {idx < activeCycle.nodes.length - 1 && (
                  <div className="hidden lg:flex items-center justify-center text-[#38BDF8] shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
