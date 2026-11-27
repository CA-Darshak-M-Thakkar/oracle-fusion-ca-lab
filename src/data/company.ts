import { GLAccount } from '../types/erp';

export const COMPANY = {
  legalEntity: 'ABC Limited',
  bu: 'ABC Mumbai Business Unit',
  ledger: 'ABC India Primary Ledger',
  currency: 'INR',
  gstin: '27AABCA1234F1Z5',
  state: 'Maharashtra',
  address: '401, Trade Centre, Andheri East, Mumbai, Maharashtra 400069',
  shipTo: 'ABC Warehouse, Bhiwandi, Maharashtra 421302',
  billTo: 'ABC Limited, Andheri East, Mumbai 400069',
  invOrg: 'ABC Mumbai Stores',
  bank: 'HDFC Bank — ABC Current Account',
  paymentProfile: 'ABC NEFT Profile',
};

export const ACCT = {
  bank: '0001',
  loan: '0003',
  re: '0005',
  building: '1002',
  machinery: '1003',
  ar: '1210',
  inventory: '1410',
  inspection: '1420',
  inputCgst: '1510',
  inputSgst: '1511',
  inputIgst: '1512',
  ap: '2001',
  grni: '2110',
  outputCgst: '2210',
  outputSgst: '2211',
  outputIgst: '2212',
  unapplied: '2215',
  revenue: '4000',
  expense: '5000',
  cogs: '5100',
} as const;

export const ACCOUNT_NAMES: Record<string, string> = {
  '0001': 'Cash and Bank — HDFC',
  '0003': 'Term Loan',
  '0005': 'Retained Earnings',
  '1002': 'Building',
  '1003': 'Machinery',
  '1210': 'Accounts Receivable',
  '1410': 'Inventory',
  '1420': 'Receiving Inspection',
  '1510': 'Input CGST',
  '1511': 'Input SGST',
  '1512': 'Input IGST',
  '2001': 'Accounts Payable',
  '2110': 'AP Accrual (GR/IR)',
  '2210': 'Output CGST',
  '2211': 'Output SGST',
  '2212': 'Output IGST',
  '2215': 'Unapplied Customer Receipts',
  '4000': 'Sales Revenue',
  '5000': 'Operating Expense',
  '5100': 'Cost of Goods Sold',
};

export function inr(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function termDays(terms: string): number {
  if (/immediate/i.test(terms)) return 0;
  const match = terms.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function dueDateFrom(invoiceDate: string, terms: string): string {
  return addDays(invoiceDate, termDays(terms));
}

export function daysPastDue(due: string, asOf = new Date()): number {
  const end = Date.UTC(asOf.getFullYear(), asOf.getMonth(), asOf.getDate());
  const [y, m, d] = due.split('-').map(Number);
  if (!y || !m || !d) return 0;
  const start = Date.UTC(y, m - 1, d);
  return Math.max(0, Math.round((end - start) / 86400000));
}

/** Supplier aging buckets from Unit 4 page 49: 0-30, 30-60, 60-90, 90+. */
export function supplierBucket(days: number): '0-30' | '30-60' | '60-90' | '90+' {
  if (days <= 30) return '0-30';
  if (days <= 60) return '30-60';
  if (days <= 90) return '60-90';
  return '90+';
}

export function splitGst(taxable: number, partyState: string) {
  const same = partyState.trim().toLowerCase() === COMPANY.state.toLowerCase();
  if (same) {
    const half = Math.round(taxable * 9) / 100;
    return { cgst: half, sgst: half, igst: 0, tax: half + half, gross: taxable + half + half, intra: true };
  }
  const igst = Math.round(taxable * 18) / 100;
  return { cgst: 0, sgst: 0, igst, tax: igst, gross: taxable + igst, intra: false };
}

export interface TrialTotals {
  openingDr: number;
  openingCr: number;
  periodDr: number;
  periodCr: number;
  endDr: number;
  endCr: number;
  balanced: boolean;
}

export function trialBalanceTotals(accounts: GLAccount[]): TrialTotals {
  let openingDr = 0;
  let openingCr = 0;
  let periodDr = 0;
  let periodCr = 0;
  let endDr = 0;
  let endCr = 0;
  for (const a of accounts) {
    if (a.beginningBalance >= 0) openingDr += a.beginningBalance;
    else openingCr += -a.beginningBalance;
    periodDr += a.debits;
    periodCr += a.credits;
    const end = a.beginningBalance + a.debits - a.credits;
    if (end >= 0) endDr += end;
    else endCr += -end;
  }
  const near = (x: number, y: number) => Math.abs(x - y) < 0.05;
  return {
    openingDr,
    openingCr,
    periodDr,
    periodCr,
    endDr,
    endCr,
    balanced: near(openingDr, openingCr) && near(periodDr, periodCr) && near(endDr, endCr),
  };
}
