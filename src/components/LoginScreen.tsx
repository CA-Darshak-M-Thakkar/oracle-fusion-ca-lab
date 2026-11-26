import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { DEMO_USERS } from '../data/seedData';
import { REQUIRED_BATCH_CODE } from '../config/attendance';
import { Lock, Mail, User, Phone, BadgeCheck, GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signIn } = useERP();
  const [selectedRoleId, setSelectedRoleId] = useState('sindhu');
  const [emailInput, setEmailInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [wroInput, setWroInput] = useState('');
  const [batchCodeInput, setBatchCodeInput] = useState('');
  const [formError, setFormError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    const name = fullNameInput.trim();
    const mobile = mobileInput.replace(/\D/g, '');
    const wroNo = wroInput.trim().toUpperCase();
    const batchCode = batchCodeInput.trim().toUpperCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid Email address (e.g., name@gmail.com).');
      return;
    }
    if (name.length < 3) {
      setFormError('Full Name is compulsory (minimum 3 characters).');
      return;
    }
    if (mobile.length !== 10) {
      setFormError('Mobile No. is compulsory (enter a valid 10-digit mobile number).');
      return;
    }
    if (wroNo.length < 5) {
      setFormError('WRO / ICAI Registration No. is compulsory (e.g., WRO0612345).');
      return;
    }
    if (batchCode !== REQUIRED_BATCH_CODE) {
      setFormError(`Invalid Batch Code. Please enter "${REQUIRED_BATCH_CODE}" provided by your faculty.`);
      return;
    }

    setFormError('');
    signIn(selectedRoleId, { email, name, mobile, wroNo, batchCode });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F6]">
      {/* Top Dark Redwood Header */}
      <div className="bg-[#2C2825] text-white px-8 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="text-[13px] text-[#D8D3CC] font-normal">Sign In — AICITSS Student Attendance &amp; ERP Lab</div>
          <h1 className="text-[25px] font-light tracking-wide mt-0.5">Oracle Applications Cloud</h1>
        </div>
      </div>

      {/* Redwood Geometric Strip */}
      <div
        className="h-3 w-full"
        style={{
          background:
            'repeating-linear-gradient(125deg, #9E3B2B 0px, #9E3B2B 28px, #D4843E 28px, #D4843E 56px, #4D7358 56px, #4D7358 84px, #355C7D 84px, #355C7D 112px)',
        }}
      />

      {/* Main Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg bg-white border border-[#E2DCD5] rounded-[4px] shadow-sm p-7">
          <div className="text-[12px] text-[#5E5852] mb-4 pb-2 border-b border-[#EFEAE4]">
            All fields marked with <span className="text-[#C74634] font-bold">*</span> are compulsory. Your login is recorded for AICITSS lab attendance.
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[12px] font-medium text-[#524C46] mb-1">
                  <span className="text-[#C74634]">*</span> Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-9 pr-3 py-2 border border-[#BCC6D0] bg-white rounded-[2px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#524C46] mb-1">
                  <span className="text-[#C74634]">*</span> WRO / ICAI Reg. No.
                </label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={wroInput}
                    onChange={(e) => setWroInput(e.target.value.toUpperCase())}
                    placeholder="e.g. WRO0612345"
                    className="w-full pl-9 pr-3 py-2 border border-[#BCC6D0] bg-white rounded-[2px] text-[13px] uppercase focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[12px] font-medium text-[#524C46] mb-1">
                  <span className="text-[#C74634]">*</span> Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="w-full pl-9 pr-3 py-2 border border-[#4A779D] bg-[#EEF4FA] rounded-[2px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#524C46] mb-1">
                  <span className="text-[#C74634]">*</span> Mobile No. (10 digits)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2 border border-[#BCC6D0] bg-white rounded-[2px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#524C46] mb-1">
                <span className="text-[#C74634]">*</span> Batch Code (Enter: <strong className="text-[#00688C]">{REQUIRED_BATCH_CODE}</strong>)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={batchCodeInput}
                  onChange={(e) => setBatchCodeInput(e.target.value.toUpperCase())}
                  placeholder={`Enter ${REQUIRED_BATCH_CODE}`}
                  className="w-full pl-9 pr-3 py-2 border border-[#BCC6D0] bg-[#EEF4FA] rounded-[2px] text-[13px] uppercase focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                  required
                />
              </div>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-[#C74634] text-[12px] rounded">
                {formError}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setHelpOpen(!helpOpen)}
                className="text-[12px] text-[#0572CE] hover:underline"
              >
                Need Batch Code?
              </button>
            </div>

            <button
              type="submit"
              className="w-full justify-center bg-[#312D2A] hover:bg-[#1E1B19] text-white text-[13px] font-medium px-6 py-2.5 rounded-[2px] transition-colors inline-flex items-center gap-2"
            >
              Sign In to Oracle ERP <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {helpOpen && (
            <div className="mt-4 p-3 bg-[#F4F6F9] border border-[#D6DFE6] rounded text-[12px] text-[#312D2A]">
              <div className="font-semibold mb-1">Batch Code</div>
              <p className="text-[#5E5852]">
                Enter Batch Code <strong>{REQUIRED_BATCH_CODE}</strong> along with your Full Name, WRO No., Email, and 10-digit Mobile No.
              </p>
            </div>
          )}
        </div>

        {/* Starting Role Picker */}
        <div className="w-full max-w-2xl mt-6 bg-white border border-[#D6DFE6] rounded-[6px] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#00688C] font-semibold text-[13px] mb-1">
            <GraduationCap className="w-4 h-4" />
            Select Starting ERP Role (You can switch roles anytime inside the app)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {DEMO_USERS.map((u) => {
              const active = selectedRoleId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedRoleId(u.id)}
                  className={`text-left p-3 rounded-[4px] border transition-all ${
                    active
                      ? 'border-[#00688C] bg-[#EDF6FA] ring-1 ring-[#00688C]'
                      : 'border-[#D6DFE6] hover:border-[#83BFE5] bg-[#FAFBFD]'
                  }`}
                >
                  <div className="text-[12.5px] font-semibold text-[#161513]">{u.role}</div>
                  <div className="text-[11px] text-[#5E5852] mt-1">{u.department}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E6ECF0] flex items-center justify-between text-[11px] text-[#5E5852]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
              Captures Name, Email, Mobile No., WRO No. &amp; Batch Code for all 60 students
            </span>
            <span>AICITSS Unit 4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
