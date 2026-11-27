import React from 'react';
import { useGuide } from '../guide/GuideLayer';
import { COMPANY } from '../../data/company';

const SLIDES: Record<string, { title: string; body: string[] }> = {
  'ori-erp': {
    title: 'What is an ERP?',
    body: [
      'ERP means Enterprise Resource Planning.',
      'It is one system for buying, stores, selling, people and accounts. They share one set of records.',
      'Example: the store receives 10 office chairs. Accounts can see those chairs without typing the bill again from a piece of paper.',
      'It is not “only Tally”. Accounts is one part of it.',
    ],
  },
  'ori-fusion': {
    title: 'Oracle Fusion, the cloud, and old EBS',
    body: [
      'Oracle Fusion Cloud is Oracle’s current ERP. You use it in a browser.',
      'Cloud means Oracle runs the computers. The company does not keep the servers in a back room.',
      'Oracle E-Business Suite (EBS) R12 is the older product. Its screens look like old desktop forms.',
      'This class is Fusion. The EBS button is only there so you can see what the old product looked like. Do not start the labs there.',
    ],
  },
  'ori-ca': {
    title: 'Why a Chartered Accountant learns it',
    body: [
      'The profit and loss account and the balance sheet come out of this system.',
      'If the purchase, the receipt or the sales invoice is wrong, the financial statements are wrong.',
      'Your work is to test those controls: who approved, what was received, what was billed, and what was paid.',
    ],
  },
  'ori-sim': {
    title: 'This screen is a simulator',
    body: [
      `The practice company is ${COMPANY.legalEntity}, ${COMPANY.address}.`,
      `Ledger: ${COMPANY.ledger}. GSTIN ${COMPANY.gstin}. Currency: rupees.`,
      'The goods are ordinary office items: Laptop, Office Chair, A4 Paper Ream and Printer.',
      'Nothing is sent to a real supplier. The entries are for the classroom.',
    ],
  },
  'ori-modules': {
    title: 'The other modules — names only',
    body: [
      'HCM — people, joiners, pay.',
      'SCM — buying, stock, warehouses.',
      'CX — customers and selling effort.',
      'EPM — budgets, forecasts and management reports.',
      'Projects — job costing. Fixed Assets — buildings and machines. Cash Management — the bank.',
      'We will not run those. We will run procure-to-pay, order-to-cash, the ledger and the audit cases.',
    ],
  },
};

export const OrientationModule: React.FC = () => {
  const { stepId } = useGuide();
  const slide = SLIDES[stepId] ?? SLIDES['ori-erp'];
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 pb-28">
      <p className="text-base font-semibold uppercase tracking-wide text-sky-300">Day 0 · Orientation</p>
      <h1 className="mt-2 text-4xl font-semibold text-slate-50">{slide.title}</h1>
      <div className="mt-6 space-y-4 text-xl leading-relaxed text-slate-100">
        {slide.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
    </div>
  );
};
