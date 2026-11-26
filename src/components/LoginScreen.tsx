import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Mail, User, Phone, BadgeCheck, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signIn } = useERP();
  const [emailInput, setEmailInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  const [wroInput, setWroInput] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    const name = fullNameInput.trim();
    const mobile = mobileInput.replace(/\D/g, '');
    const wroNo = wroInput.trim().toUpperCase();

    if (name.length < 3) {
      setFormError('Full Name is compulsory (minimum 3 characters).');
      return;
    }
    if (wroNo.length < 5) {
      setFormError('WRO / ICAI Registration No. is compulsory (e.g., WRO0612345).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid Email address (e.g., name@gmail.com).');
      return;
    }
    if (mobile.length !== 10) {
      setFormError('Mobile No. is compulsory (enter a valid 10-digit mobile number).');
      return;
    }

    setFormError('');
    signIn('sindhu', { email, name, mobile, wroNo });
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
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg bg-white border border-[#E2DCD5] rounded-[4px] shadow-sm p-8">
          <div className="text-[12px] text-[#5E5852] mb-5 pb-2.5 border-b border-[#EFEAE4]">
            All fields marked with <span className="text-[#C74634] font-bold">*</span> are compulsory. Your login is recorded for AICITSS lab attendance.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-[#C74634] text-[12px] rounded">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="w-full justify-center bg-[#312D2A] hover:bg-[#1E1B19] text-white text-[13px] font-medium px-6 py-2.5 rounded-[2px] transition-colors inline-flex items-center gap-2 mt-2"
            >
              Sign In to Oracle ERP <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="mt-5 pt-3 border-t border-[#E6ECF0] flex items-center justify-between text-[11px] text-[#5E5852]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
              Oracle Fusion Cloud &amp; EBS R12 Simulator
            </span>
            <span>AICITSS Unit 4</span>
          </div>
        </div>
      </div>
    </div>
  );
};
