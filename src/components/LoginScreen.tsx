import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { DEMO_USERS } from '../data/seedData';
import { Lock, Mail, User, GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signIn, showToast } = useERP();
  const [selectedRoleId, setSelectedRoleId] = useState('sindhu');
  const [emailInput, setEmailInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('AICITSS2026');
  const [emailError, setEmailError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Please enter your valid email address (e.g., name@gmail.com or name@icai.org).');
      return;
    }
    setEmailError('');
    signIn(selectedRoleId, trimmed, fullNameInput);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F6]">
      {/* Top Dark Redwood Header (Page 10 of PDF) */}
      <div className="bg-[#2C2825] text-white px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-[14px] text-[#D8D3CC] font-normal">Sign In</div>
          <h1 className="text-[26px] font-light tracking-wide mt-0.5">Oracle Applications Cloud</h1>
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
        <div className="w-full max-w-md bg-white border border-[#E2DCD5] rounded-[4px] shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[#524C46] mb-1">
                * Student Email (User ID)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="your.email@gmail.com"
                  className="w-full pl-9 pr-3 py-2 border border-[#4A779D] bg-[#EEF4FA] rounded-[2px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                  required
                />
              </div>
              {emailError && <p className="text-[11.5px] text-[#C74634] mt-1">{emailError}</p>}
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#524C46] mb-1">
                Full Name (shown on reports &amp; submission)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="e.g. Rahul Sharma (auto-filled if blank)"
                  className="w-full pl-9 pr-3 py-2 border border-[#BCC6D0] bg-white rounded-[2px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#524C46] mb-1">Password / Batch Code</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#BCC6D0] bg-[#EEF4FA] rounded-[2px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-[12px] text-[#0572CE] hover:underline"
              >
                Forgot Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmailInput('sindhu.konduru@oraclefusion.edu');
                  setFullNameInput('Sindhu Konduru');
                  showToast('info', 'Demo Email Filled', 'Click Sign In to enter with the demo email.');
                }}
                className="text-[11.5px] text-[#00688C] hover:underline"
              >
                Use Demo Email
              </button>
            </div>

            <button
              type="submit"
              className="w-full justify-center bg-[#312D2A] hover:bg-[#1E1B19] text-white text-[13px] font-medium px-6 py-2.5 rounded-[2px] transition-colors inline-flex items-center gap-2"
            >
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {forgotOpen && (
            <div className="mt-4 p-3 bg-[#F4F6F9] border border-[#D6DFE6] rounded text-[12px] text-[#312D2A]">
              <div className="font-semibold mb-1">AICITSS Classroom Login Help</div>
              <p className="text-[#5E5852]">
                Enter your personal or ICAI email address above and your Full Name. Default batch password is{' '}
                <strong>AICITSS2026</strong> (any password works in training mode).
              </p>
              <button
                type="button"
                onClick={() => setForgotOpen(false)}
                className="mt-2 text-[#00688C] font-medium hover:underline"
              >
                Close
              </button>
            </div>
          )}
        </div>

        {/* Starting Role Picker */}
        <div className="w-full max-w-2xl mt-7 bg-white border border-[#D6DFE6] rounded-[6px] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#00688C] font-semibold text-[13px] mb-1">
            <GraduationCap className="w-4 h-4" />
            Select Starting ERP Role (You can switch roles anytime inside the app)
          </div>
          <p className="text-[12px] text-[#5E5852] mb-4">
            Enter your <strong>actual email</strong> above, pick a starting role below, and click <strong>Sign In</strong>. Your email &amp; name will be recorded on every transaction and your final Lab Submission CSV.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-7 h-7 rounded-full bg-[#00688C] text-white text-[11px] font-bold flex items-center justify-center">
                      {u.initials}
                    </span>
                    <div>
                      <div className="text-[12.5px] font-semibold text-[#161513]">{u.role}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-[#5E5852] mt-1">{u.department}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E6ECF0] flex items-center justify-between text-[11px] text-[#5E5852]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D32]" />
              Supports 60+ concurrent students with per-student Audit Trail &amp; CSV Submission
            </span>
            <span>Unit 4 — Auditing of Financial Business Processes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
