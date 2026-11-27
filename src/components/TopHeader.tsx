import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Home,
  Star,
  Flag,
  Bell,
  GraduationCap,
  RotateCcw,
  LogOut,
  Users,
  CheckCircle2,
  AlertTriangle,
  FolderDown,
} from 'lucide-react';
import { useERP } from '../context/ERPContext';
import { DEMO_USERS } from '../data/seedData';
import { ModuleRoute } from '../types/erp';
import { StudentLabPackModal } from './StudentLabPackModal';

interface TopHeaderProps {
  onOpenNavigator: () => void;
  onSwitchToEBS?: () => void;
}

const SEARCH_INDEX: { label: string; category: string; route: ModuleRoute }[] = [
  { label: 'Purchase Requisitions (Create Noncatalog / Shop)', category: 'Procurement', route: 'purchase_requisitions' },
  { label: 'Create Noncatalog Request', category: 'Procurement', route: 'create_noncatalog' },
  { label: 'Process Requisitions (Document Builder)', category: 'Procurement', route: 'process_requisitions' },
  { label: 'Purchase Orders (Manage Orders)', category: 'Procurement', route: 'purchase_orders' },
  { label: 'My Receipts / Receive Items (GRN)', category: 'Procurement', route: 'my_receipts' },
  { label: 'Payables Invoices (3-Way Matching)', category: 'Payables', route: 'payables_invoices' },
  { label: 'Payables Payments (Create Payment)', category: 'Payables', route: 'payables_payments' },
  { label: 'Order Management (Create Sales Order)', category: 'Order Management', route: 'order_management' },
  { label: 'Inventory Management (Pick Wave & Ship Confirm)', category: 'Supply Chain', route: 'inventory_management' },
  { label: 'Manage Shipments & Packing Slip', category: 'Supply Chain', route: 'manage_shipments' },
  { label: 'Receivables Billing (Manage Transactions)', category: 'Receivables', route: 'receivables_billing' },
  { label: 'Accounts Receivable (Create Receipt)', category: 'Receivables', route: 'accounts_receivable' },
  { label: 'Inquire on Detail Balances (GL)', category: 'General Accounting', route: 'detail_balances' },
  { label: 'Journals (Subledger & Manual)', category: 'General Accounting', route: 'journals' },
  { label: 'Scheduled Processes (Trial Balance & Aging)', category: 'Tools', route: 'scheduled_processes' },
  { label: 'Audit Reports (Fusion Audit Trail)', category: 'Tools', route: 'audit_reports' },
  { label: 'CA Audit Lab & Red Flags (Case Studies 9.1 & 9.2)', category: 'Risk Management', route: 'ca_audit_lab' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenNavigator, onSwitchToEBS }) => {
  const {
    currentUser,
    switchUser,
    signOut,
    navigate,
    favorites,
    notifications,
    markNotificationRead,
    teachingMode,
    setTeachingMode,
    resetDemoData,
    requisitions,
    purchaseOrders,
    apInvoices,
    salesOrders,
    arTransactions,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'fav' | 'watch' | 'notif' | 'user' | null>(null);
  const [labPackOpen, setLabPackOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const searchResults = searchQuery.trim()
    ? [
        ...SEARCH_INDEX.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((item) => ({ ...item, id: undefined as string | undefined })),
        ...purchaseOrders
          .filter((po) => po.id.includes(searchQuery) || po.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((po) => ({
            label: `PO #${po.id} — ${po.supplier} (₹${po.totalAmount})`,
            category: 'Purchase Order',
            route: 'edit_po' as ModuleRoute,
            id: po.id,
          })),
        ...requisitions
          .filter((r) => r.id.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((r) => ({
            label: `Req ${r.id} — ${r.description}`,
            category: 'Requisition',
            route: 'edit_requisition' as ModuleRoute,
            id: r.id,
          })),
        ...salesOrders
          .filter((so) => so.id.toLowerCase().includes(searchQuery.toLowerCase()) || so.customer.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((so) => ({
            label: `${so.id} — ${so.customer}`,
            category: 'Sales Order',
            route: 'order_management' as ModuleRoute,
            id: so.id,
          })),
      ].slice(0, 8)
    : [];

  const pendingApprovals = requisitions.filter((r) => r.status === 'Pending approval').length;
  const varianceInvoices = apInvoices.filter((i) => i.matchStatus !== 'Matched (3-Way)').length;
  const overdueAR = arTransactions.filter((t) => t.daysPastDue > 0 && t.balanceDue > 0).length;

  return (
    <header
      ref={headerRef}
      className="oracle-header-gradient text-white h-[48px] px-3 flex items-center justify-between shadow-sm relative z-40 no-print"
    >
      {/* Left: Navigator + ORACLE wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenNavigator}
          title="Navigator"
          className="p-1.5 rounded hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <Menu className="w-5 h-5" />
          <span className="font-bold tracking-[0.18em] text-[15px] select-none">ORACLE</span>
        </button>
      </div>

      {/* Center: Global Search */}
      <div className="flex-1 max-w-xl mx-4 relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#5E6C7A] absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setSearchFocused(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchFocused(true);
            }}
            placeholder="Search modules, PO#, Requisition#, Invoices, Reports..."
            className="w-full h-[30px] pl-8 pr-3 rounded-[3px] bg-white/95 text-[#161513] placeholder-[#6B7785] text-[12.5px] focus:outline-none focus:bg-white shadow-inner"
          />
        </div>

        {searchFocused && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-[34px] bg-white text-[#161513] border border-[#D6DFE6] rounded-[4px] shadow-xl overflow-hidden z-50">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-[12px] text-[#5E5852]">No matching Oracle Fusion tasks or records.</div>
            ) : (
              searchResults.map((res, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(res.route, res.id ?? null);
                    setSearchQuery('');
                    setSearchFocused(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-[#EDF6FA] border-b border-[#F0F3F5] last:border-0 flex items-center justify-between"
                >
                  <span className="text-[12.5px] font-medium text-[#00688C]">{res.label}</span>
                  <span className="text-[11px] bg-[#EFF3F7] text-[#312D2A] px-2 py-0.5 rounded">{res.category}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Utility Icons */}
      <div className="flex items-center gap-1.5">
        {onSwitchToEBS && (
          <button
            onClick={onSwitchToEBS}
            title="Switch to Classic Oracle EBS R12 Forms UI (from P2P PDF)"
            className="px-2.5 py-1 rounded text-[11.5px] font-medium flex items-center gap-1 bg-[#2D5F7E] border border-white/30 text-white hover:bg-[#1E445C] transition-colors mr-1 whitespace-nowrap shrink-0"
          >
            <span className="hidden md:inline">EBS R12 Classic UI</span>
            <span className="md:hidden">EBS UI</span>
          </button>
        )}
        <button
          onClick={() => setLabPackOpen(true)}
          title="Download Sample Files & Track Completed Lab Tasks"
          className="px-2.5 py-1 rounded text-[11.5px] font-medium flex items-center gap-1.5 bg-white/15 text-white hover:bg-white/25 transition-colors mr-1"
        >
          <FolderDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lab Pack &amp; Files</span>
        </button>

        <button
          onClick={() => setTeachingMode(!teachingMode)}
          title="Toggle CA Student Guided Walkthrough"
          className={`px-2.5 py-1 rounded text-[11.5px] font-medium flex items-center gap-1.5 transition-colors mr-1 ${
            teachingMode
              ? 'bg-[#FFE082] text-[#312D2A] shadow-sm'
              : 'bg-white/15 text-white hover:bg-white/25'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CA Guide {teachingMode ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={() => navigate('home')}
          title="Home"
          className="p-1.5 rounded hover:bg-white/15 transition-colors"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Favorites */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'fav' ? null : 'fav')}
            title="Favorites"
            className="p-1.5 rounded hover:bg-white/15 transition-colors"
          >
            <Star className="w-4 h-4" />
          </button>
          {openDropdown === 'fav' && (
            <div className="absolute right-0 top-9 w-64 bg-white text-[#161513] border border-[#D6DFE6] rounded shadow-xl z-50 py-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-[#5E6C7A] border-b border-[#E6ECF0]">
                Favorites
              </div>
              {favorites.map((fav) => (
                <button
                  key={fav.route}
                  onClick={() => {
                    navigate(fav.route);
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-[12.5px] hover:bg-[#EDF6FA] text-[#00688C]"
                >
                  {fav.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Watchlist */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'watch' ? null : 'watch')}
            title="Watchlist"
            className="p-1.5 rounded hover:bg-white/15 transition-colors"
          >
            <Flag className="w-4 h-4" />
          </button>
          {openDropdown === 'watch' && (
            <div className="absolute right-0 top-9 w-72 bg-white text-[#161513] border border-[#D6DFE6] rounded shadow-xl z-50 py-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-[#5E6C7A] border-b border-[#E6ECF0]">
                Watchlist (Live ERP Metrics)
              </div>
              <button
                onClick={() => {
                  navigate('manage_requisitions');
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#EDF6FA] flex justify-between"
              >
                <span>Requisitions Pending Approval</span>
                <span className="font-bold text-[#00688C]">{pendingApprovals}</span>
              </button>
              <button
                onClick={() => {
                  navigate('payables_invoices');
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#EDF6FA] flex justify-between"
              >
                <span>AP Match Variances / Red Flags</span>
                <span className="font-bold text-[#C74634]">{varianceInvoices}</span>
              </button>
              <button
                onClick={() => {
                  navigate('receivables_billing');
                  setOpenDropdown(null);
                }}
                className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#EDF6FA] flex justify-between"
              >
                <span>Overdue Customer Invoices</span>
                <span className="font-bold text-[#D97706]">{overdueAR}</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'notif' ? null : 'notif')}
            title="Notifications"
            className="p-1.5 rounded hover:bg-white/15 transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#C74634] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {openDropdown === 'notif' && (
            <div className="absolute right-0 top-9 w-80 bg-white text-[#161513] border border-[#D6DFE6] rounded shadow-xl z-50 overflow-hidden">
              <div className="px-3 py-2 text-[12px] font-semibold bg-[#F4F6F9] border-b border-[#D6DFE6] flex justify-between">
                <span>Notifications ({unreadCount} unread)</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#EEF2F5]">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.targetRoute) navigate(n.targetRoute, n.targetId ?? null);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2.5 hover:bg-[#EDF6FA] transition-colors ${
                      !n.read ? 'bg-[#F6FAFD]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#161513]">
                      {n.title.includes('Alert') ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-[#C74634]" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                      )}
                      {n.title}
                    </div>
                    <p className="text-[11.5px] text-[#5E5852] mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-[#8C847C] mt-1 block">{n.timestamp}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="relative ml-1">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
            className="w-7 h-7 rounded-full bg-white text-[#00688C] font-bold text-[11px] flex items-center justify-center shadow-sm hover:ring-2 hover:ring-white/60 transition-all"
            title={currentUser.name}
          >
            {currentUser.initials}
          </button>
          {openDropdown === 'user' && (
            <div className="absolute right-0 top-9 w-72 bg-white text-[#161513] border border-[#D6DFE6] rounded shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 bg-[#F4F6F9] border-b border-[#D6DFE6]">
                <div className="text-[13px] font-semibold">{currentUser.name}</div>
                {currentUser.email && <div className="text-[11px] text-[#524C46] truncate">{currentUser.email}</div>}
                {currentUser.wroNo && <div className="text-[11px] text-[#524C46]">WRO: {currentUser.wroNo}</div>}
                <div className="text-[11.5px] text-[#00688C] font-medium mt-0.5">{currentUser.role}</div>
                <div className="text-[11px] text-[#5E5852]">{currentUser.department}</div>
              </div>

              <div className="p-2 border-b border-[#E6ECF0]">
                <div className="px-2 py-1 text-[10.5px] font-semibold uppercase text-[#5E6C7A] flex items-center gap-1">
                  <Users className="w-3 h-3" /> Switch Role (Test SoD)
                </div>
                {DEMO_USERS.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-[12px] flex items-center justify-between ${
                      u.role === currentUser.role ? 'bg-[#EDF6FA] text-[#00688C] font-semibold' : 'hover:bg-[#F4F6F9]'
                    }`}
                  >
                    <span>{u.role}</span>
                  </button>
                ))}
              </div>

              <div className="p-1.5">
                <button
                  onClick={() => {
                    resetDemoData();
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#FFF4F2] text-[#C74634] rounded flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Data
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setOpenDropdown(null);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] hover:bg-[#F4F6F9] text-[#312D2A] rounded flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <StudentLabPackModal open={labPackOpen} onClose={() => setLabPackOpen(false)} />
    </header>
  );
};
