import React, { useState } from 'react';
import { X, Download, CheckCircle2, Circle, FileSpreadsheet, ClipboardCheck, Users } from 'lucide-react';
import { useERP } from '../context/ERPContext';

interface StudentLabPackModalProps {
  open: boolean;
  onClose: () => void;
}

export const StudentLabPackModal: React.FC<StudentLabPackModalProps> = ({ open, onClose }) => {
  const {
    currentUser,
    requisitions,
    purchaseOrders,
    receipts,
    apInvoices,
    apPayments,
    salesOrders,
    shipments,
    arReceipts,
    scheduledJobs,
    journals,
  } = useERP();

  const [studentName, setStudentName] = useState(currentUser.name);
  const [rollNumber, setRollNumber] = useState('ICAI-AICITSS-01');

  if (!open) return null;

  // Auto-detect which tasks the student has actually performed beyond initial seed data
  const tasks = [
    { id: 'T1', label: 'Create & Submit a Purchase Requisition', done: requisitions.length > 4 },
    { id: 'T2', label: 'Convert Requisition to Open Purchase Order', done: purchaseOrders.length > 2 },
    { id: 'T3', label: 'Receive Goods & Generate GRN', done: receipts.length > 2 },
    { id: 'T4', label: 'Create AP Invoice & Run 3-Way Match', done: apInvoices.length > 4 },
    { id: 'T5', label: 'Issue Supplier Payment', done: apPayments.length > 1 },
    { id: 'T6', label: 'Create Sales Order in Order Management', done: salesOrders.length > 2 },
    { id: 'T7', label: 'Release Pick Wave & Ship Confirm (Packing Slip)', done: shipments.some((s) => s.status === 'Confirmed') },
    { id: 'T8', label: 'Collect & Apply Customer AR Receipt', done: arReceipts.length > 0 },
    { id: 'T9', label: 'Post Manual Journal or Run Scheduled Report', done: scheduledJobs.length > 3 || journals.length > 2 },
  ];

  const completedCount = tasks.filter((t) => t.done).length;

  const downloadSubmissionProof = () => {
    const rows = [
      ['Student Name', studentName],
      ['ICAI / Batch Roll No', rollNumber],
      ['Completed Tasks', `${completedCount} / ${tasks.length}`],
      ['Timestamp', new Date().toISOString()],
      [],
      ['Task ID', 'Task Description', 'Status'],
      ...tasks.map((t) => [t.id, t.label, t.done ? 'COMPLETED' : 'PENDING']),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rollNumber}_Oracle_Fusion_Lab_Submission.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sampleFiles = [
    {
      name: '01_CA_Student_Lab_Workbook.txt',
      title: 'CA Student Step-by-Step Lab Workbook (TXT)',
      desc: 'Complete 10-task hands-on guide for P2P, O2C, GL & Audit',
    },
    {
      name: '02_Sample_P2P_Practice_Data.csv',
      title: 'Sample P2P Purchase & Invoice Data (CSV)',
      desc: 'Test cases for 3-Way Match, Qty Variance & Unauthorized Vendor',
    },
    {
      name: '03_Sample_O2C_Practice_Data.csv',
      title: 'Sample O2C Sales Order Data (CSV)',
      desc: 'Test cases for Standard Order & Credit Limit Hold',
    },
    {
      name: '04_Sample_Audit_Checklist_AICITSS.csv',
      title: 'AICITSS Audit & Red Flags Worksheet (CSV)',
      desc: 'Auditor checklist for Case Study 9.1 & 9.2',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-[6px] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3.5 bg-[#00688C] text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[15px]">
            <Users className="w-4 h-4" />
            Student Lab Pack, Sample Files & Live Task Tracker
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 text-[12.5px]">
          {/* Downloadable Sample Files */}
          <div>
            <h4 className="font-semibold text-[14px] text-[#161513] mb-2 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-[#00688C]" />
              1. Download Sample Practice Files
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sampleFiles.map((f) => (
                <a
                  key={f.name}
                  href={`./sample-files/${f.name}`}
                  download={f.name}
                  className="p-3 border border-[#D6DFE6] rounded hover:border-[#00688C] hover:bg-[#EDF6FA] transition-colors flex items-start justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-[#00688C]">{f.title}</div>
                    <div className="text-[11.5px] text-[#5E5852] mt-0.5">{f.desc}</div>
                  </div>
                  <Download className="w-4 h-4 text-[#00688C] shrink-0 mt-1" />
                </a>
              ))}
            </div>
          </div>

          {/* Live Task Completion Tracker */}
          <div className="border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="font-semibold text-[14px] text-[#161513] flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-[#2E7D32]" />
                2. Live Task Completion Tracker ({completedCount} / {tasks.length} Completed)
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EDF6FA] text-[#00688C] font-semibold text-[11.5px]">
                Auto-tracked as you work
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {tasks.map((t) => (
                <div
                  key={t.id}
                  className={`p-2.5 rounded border flex items-center gap-2 ${
                    t.done ? 'bg-green-50 border-green-200 text-[#1B5E20]' : 'bg-[#FAFBFD] border-[#E6ECF0] text-[#5E5852]'
                  }`}
                >
                  {t.done ? (
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#BCC6D0] shrink-0" />
                  )}
                  <span className="font-medium">{t.id}: {t.label}</span>
                </div>
              ))}
            </div>

            {/* Export Submission Proof */}
            <div className="bg-[#F4F6F9] p-3.5 rounded border border-[#D6DFE6] flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] text-[#5E6C7A] mb-1">Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="oracle-input w-full"
                />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] text-[#5E6C7A] mb-1">ICAI Reg / Roll Number</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="oracle-input w-full"
                />
              </div>
              <button onClick={downloadSubmissionProof} className="oracle-btn-primary">
                <Download className="w-3.5 h-3.5" /> Download Lab Submission Proof (CSV)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
