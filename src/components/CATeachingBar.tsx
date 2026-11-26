import React, { useState } from 'react';
import { GraduationCap, ChevronDown, ChevronUp, CheckCircle2, ArrowRight, HelpCircle } from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { ModuleRoute } from '../types/erp';

interface LabStep {
  title: string;
  route: ModuleRoute;
  caTip: string;
}

const LABS: Record<string, { name: string; subtitle: string; steps: LabStep[] }> = {
  p2p: {
    name: 'Lab 1: Procure-to-Pay (P2P)',
    subtitle: 'Requisition → PO → GRN → 3-Way Match Invoice → Payment',
    steps: [
      { title: '1. Create Requisition', route: 'create_noncatalog', caTip: 'Internal shopping list; checks budget & authorization before buying.' },
      { title: '2. Convert to PO', route: 'process_requisitions', caTip: 'Legally binding contract sent to an approved vendor.' },
      { title: '3. Receive Goods (GRN)', route: 'my_receipts', caTip: 'Proves physical delivery; required for 3-Way Matching.' },
      { title: '4. AP Invoice & 3-Way Match', route: 'payables_invoices', caTip: 'Matches PO + GRN + Vendor Invoice; posts Dr Expense / Cr AP.' },
      { title: '5. Pay Supplier', route: 'create_ap_payment', caTip: 'Disburses cash/check; posts Dr AP / Cr Bank.' },
    ],
  },
  o2c: {
    name: 'Lab 2: Order-to-Cash (O2C)',
    subtitle: 'Sales Order → Pick Wave → Ship Confirm → AR Invoice → Receipt',
    steps: [
      { title: '1. Create Sales Order', route: 'create_sales_order', caTip: 'Checks customer credit limit before accepting order.' },
      { title: '2. Pick Wave & Confirm', route: 'pick_waves', caTip: 'Warehouse reserves & picks stock from shelves.' },
      { title: '3. Ship Confirm', route: 'manage_shipments', caTip: 'Generates Packing Slip & triggers Revenue Recognition (AS-9 / Ind AS 115).' },
      { title: '4. Review AR Invoice', route: 'receivables_billing', caTip: 'Verifies customer balance & posts Dr AR / Cr Sales Revenue.' },
      { title: '5. Collect & Apply Receipt', route: 'create_ar_receipt', caTip: 'Matches customer cash to open invoice; posts Dr Bank / Cr AR.' },
    ],
  },
  reports: {
    name: 'Lab 3: GL & Financial Reports',
    subtitle: 'Detail Balances → Scheduled Processes → Trial Balance & Aging',
    steps: [
      { title: '1. Inquire Detail Balances', route: 'detail_balances', caTip: 'Verify live Dr/Cr balances per GL account segment.' },
      { title: '2. View SLA Journals', route: 'journals', caTip: 'Trace subledger AP/AR postings into General Ledger.' },
      { title: '3. Run Scheduled Reports', route: 'scheduled_processes', caTip: 'Generate Trial Balance, Supplier Aging & AR 4-Bucket Aging.' },
    ],
  },
  audit: {
    name: 'Lab 4: Fusion Audit & Case Studies',
    subtitle: 'Companies Act 2013 Audit Trail & Red Flag Detection',
    steps: [
      { title: '1. Fusion Audit Reports', route: 'audit_reports', caTip: 'Track Create/Update/Delete logs with Old vs New values & Export to Excel.' },
      { title: '2. CA Audit Lab & Case Studies', route: 'ca_audit_lab', caTip: 'Investigate ABC Ltd. P2P & O2C red flags and SoD violations.' },
    ],
  },
};

export const CATeachingBar: React.FC = () => {
  const { teachingMode, activeLabId, setActiveLabId, currentRoute, navigate } = useERP();
  const [collapsed, setCollapsed] = useState(false);

  if (!teachingMode) return null;

  const lab = LABS[activeLabId ?? 'p2p'] ?? LABS.p2p;

  return (
    <div className="bg-[#FFFBEB] border-b border-[#F59E0B]/40 text-[#312D2A] no-print">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#F59E0B] text-white p-1 rounded">
              <GraduationCap className="w-4 h-4" />
            </span>
            <span className="text-[12.5px] font-semibold">CA Student Guided Lab:</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(LABS).map(([id, info]) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveLabId(id);
                    setCollapsed(false);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-medium transition-colors ${
                    (activeLabId ?? 'p2p') === id
                      ? 'bg-[#00688C] text-white'
                      : 'bg-white border border-[#D6DFE6] text-[#312D2A] hover:bg-[#EDF6FA]'
                  }`}
                >
                  {info.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[11.5px] text-[#00688C] font-medium flex items-center gap-1 hover:underline"
          >
            {collapsed ? 'Show Steps' : 'Hide Steps'}
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!collapsed && (
          <div className="mt-2 pt-2 border-t border-[#F59E0B]/25 flex flex-wrap items-center gap-2">
            {lab.steps.map((step, idx) => {
              const isCurrent = currentRoute === step.route;
              return (
                <div key={step.route} className="flex items-center gap-1.5">
                  <button
                    onClick={() => navigate(step.route)}
                    title={step.caTip}
                    className={`px-2.5 py-1 rounded text-[11.5px] flex items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-[#00688C] text-white font-semibold shadow-sm'
                        : 'bg-white border border-[#E2D5B5] hover:border-[#00688C] text-[#312D2A]'
                    }`}
                  >
                    {isCurrent ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FFE082]" />
                    ) : (
                      <HelpCircle className="w-3 h-3 text-[#00688C]" />
                    )}
                    {step.title}
                  </button>
                  {idx < lab.steps.length - 1 && <ArrowRight className="w-3 h-3 text-[#9CA3AF]" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
