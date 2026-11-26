import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { DEMO_USERS } from '../data/seedData';
import { Lock, User, GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signIn, showToast } = useERP();
  const [selectedUserId, setSelectedUserId] = useState('sindhu');
  const [userIdInput, setUserIdInput] = useState('sindhu.konduru@oraclefusion.edu');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(selectedUserId);
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
              <label className="block text-[12px] font-medium text-[#524C46] mb-1">User ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8C847C] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-[#4A779D] bg-[#EEF4FA] rounded-[2px] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#00688C]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#524C46] mb-1">Password</label>
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
            </div>

            <button
              type="submit"
              className="bg-[#312D2A] hover:bg-[#1E1B19] text-white text-[13px] font-medium px-6 py-2 rounded-[2px] transition-colors inline-flex items-center gap-2"
            >
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {forgotOpen && (
            <div className="mt-4 p-3 bg-[#F4F6F9] border border-[#D6DFE6] rounded text-[12px] text-[#312D2A]">
              <div className="font-semibold mb-1">Password Reset (Demo Environment)</div>
              <p className="text-[#5E5852]">
                This is an AICITSS CA Teaching Simulator. Use any of the pre-configured student roles below to sign in
                instantly!
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

        {/* CA Student Quick Role Picker */}
        <div className="w-full max-w-2xl mt-8 bg-white border border-[#D6DFE6] rounded-[6px] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[#00688C] font-semibold text-[13px] mb-1">
            <GraduationCap className="w-4 h-4" />
            AICITSS — CA Student Training Mode (Select a Persona to Explore)
          </div>
          <p className="text-[12px] text-[#5E5852] mb-4">
            New to Oracle Fusion ERP? Pick a role below and click <strong>Sign In</strong>. You can also switch roles
            anytime from the top-right user menu to test <strong>Segregation of Duties (SoD)</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DEMO_USERS.map((u) => {
              const active = selectedUserId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(u.id);
                    setUserIdInput(`${u.id}@oraclefusion.edu`);
                    showToast('info', 'Role Selected', `Click "Sign In" to enter as ${u.name}`);
                  }}
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
                      <div className="text-[13px] font-semibold text-[#161513]">{u.name}</div>
                      <div className="text-[11px] text-[#00688C] font-medium">{u.role}</div>
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
              Includes full P2P, O2C, Trial Balance, Aging Reports & Companies Act 2013 Audit Trail
            </span>
            <span>Unit 4 — Auditing of Financial Business Processes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
