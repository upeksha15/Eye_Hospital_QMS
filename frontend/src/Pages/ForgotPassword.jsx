import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle, Eye } from 'lucide-react';
import api from '../api/client';
import backg1 from '../assets/backg1.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSuccessMessage('If this email exists, an OTP has been sent.');
      setStep(2);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!otp.trim()) {
      setError('Please enter the OTP sent to your email');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/verify-otp', { email: email.trim(), otp: otp.trim() });
      setSuccessMessage('OTP verified. You can now set a new password.');
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/auth/reset-password', {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });
      setSuccessMessage('Password updated successfully. You can now log in.');
      // Small delay then redirect to login
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (step === 1) {
      return (
        <form onSubmit={handleSendEmail} className="space-y-4 mt-2">
          <div>
            <label className="mb-2 block text-sm text-cyan-50/90">Registered Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/70" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 w-full rounded-lg border bg-slate-900/20 pl-10 pr-3 text-sm text-white placeholder:text-cyan-100/40 focus:border-cyan-300/50 focus:outline-none border-cyan-100/25"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-cyan-200/80 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-sm font-semibold text-white shadow-[0_0_20px_rgba(56,189,248,0.55)] transition disabled:cursor-not-allowed disabled:opacity-60 mt-4"
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </span>
          </button>
        </form>
      );
    }

    if (step === 2) {
      return (
        <form onSubmit={handleVerifyOtp} className="space-y-4 mt-2">
          <div>
            <label className="mb-2 block text-sm text-cyan-50/90">Enter OTP</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/70" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="h-11 w-full rounded-lg border bg-slate-900/20 pl-10 pr-3 text-sm text-center tracking-[0.3em] text-white placeholder:text-cyan-100/40 focus:border-cyan-300/50 focus:outline-none border-cyan-100/25"
              />
            </div>
            <p className="text-xs text-cyan-100/70 mt-2">Enter the OTP sent to {email}.</p>
          </div>
          <div className="flex justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-cyan-100 font-semibold rounded-full border border-cyan-100/20 transition-all duration-300 text-sm"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex-1 flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full border border-cyan-200/80 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-sm font-semibold text-white shadow-[0_0_20px_rgba(56,189,248,0.55)] transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </span>
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="space-y-4 mt-2">
        <div>
          <label className="mb-2 block text-sm text-cyan-50/90">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/70" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="h-11 w-full rounded-lg border bg-slate-900/20 pl-10 pr-3 text-sm text-white placeholder:text-cyan-100/40 focus:border-cyan-300/50 focus:outline-none border-cyan-100/25"
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm text-cyan-50/90">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/70" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="h-11 w-full rounded-lg border bg-slate-900/20 pl-10 pr-3 text-sm text-white placeholder:text-cyan-100/40 focus:border-cyan-300/50 focus:outline-none border-cyan-100/25"
            />
          </div>
        </div>
        <div className="flex justify-between gap-3 mt-4">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-cyan-100 font-semibold rounded-full border border-cyan-100/20 transition-all duration-300 text-sm"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="group relative flex-1 flex h-11 items-center justify-center gap-2 overflow-hidden rounded-full border border-cyan-200/80 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-sm font-semibold text-white shadow-[0_0_20px_rgba(56,189,248,0.55)] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? 'Updating...' : 'Update Password'}
            </span>
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-[#041a3f] text-white">
      <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative flex h-screen items-center justify-center overflow-hidden px-4 py-4 sm:px-8">
          <div className="absolute inset-0 login-blue-grid" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,170,255,0.2),transparent_45%),radial-gradient(circle_at_80%_65%,rgba(20,90,180,0.35),transparent_50%)]" />

          <div className="relative z-10 w-full max-w-sm">
            <div className="mb-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mx-auto mb-3 inline-flex h-14 w-14 translate-y-1 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-400/10 shadow-[0_0_20px_rgba(46,174,255,0.45)] hover:bg-cyan-400/20 transition-colors"
                aria-label="Back to login"
              >
                <ArrowLeft className="h-6 w-6 text-cyan-200" />
              </button>
              <h1 className="text-2xl font-medium tracking-wide text-cyan-50">Forgot Password</h1>
              <p className="mt-2 text-sm text-cyan-100/70">
                {step === 1 && 'Enter your registered email to receive an OTP.'}
                {step === 2 && 'Enter the OTP we sent to your email.'}
                {step === 3 && 'Set a new password for your account.'}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-100/20 bg-white/10 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-6 text-[11px] font-semibold tracking-wider text-cyan-100/80">
                <div className={`flex-1 flex items-center justify-center flex-col gap-1 ${step >= 1 ? 'text-cyan-200' : 'text-cyan-100/40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'border-cyan-100/20 bg-slate-800/40'}`}>
                    1
                  </div>
                  Email
                </div>
                <div className={`w-8 h-px ${step >= 2 ? 'bg-cyan-400/50' : 'bg-cyan-100/20'}`} />
                <div className={`flex-1 flex items-center justify-center flex-col gap-1 ${step >= 2 ? 'text-cyan-200' : 'text-cyan-100/40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'border-cyan-100/20 bg-slate-800/40'}`}>
                    2
                  </div>
                  OTP
                </div>
                <div className={`w-8 h-px ${step >= 3 ? 'bg-cyan-400/50' : 'bg-cyan-100/20'}`} />
                <div className={`flex-1 flex items-center justify-center flex-col gap-1 ${step >= 3 ? 'text-cyan-200' : 'text-cyan-100/40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.4)]' : 'border-cyan-100/20 bg-slate-800/40'}`}>
                    3
                  </div>
                  Password
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="mb-4 rounded-lg border border-red-400/60 bg-red-500/20 p-2 text-xs text-red-200 text-center">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 rounded-lg border border-emerald-400/60 bg-emerald-500/20 p-2 text-xs text-emerald-200 text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {successMessage}
                </div>
              )}

              {renderContent()}
            </div>
          </div>
        </div>
        <div
          className="hidden h-screen lg:block bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/login-right-hospital.png')" }}
        />
      </div>

      <style>{`
        .login-blue-grid {
          background-color: #07214c;
          background-image:
            radial-gradient(circle at 12% 22%, rgba(94, 177, 255, 0.26), transparent 40%),
            radial-gradient(circle at 82% 70%, rgba(43, 120, 210, 0.34), transparent 45%),
            repeating-radial-gradient(circle at 65% 45%, rgba(132, 185, 255, 0.08), rgba(132, 185, 255, 0.08) 2px, transparent 2px, transparent 16px);
        }

        input::placeholder {
          letter-spacing: 0.01em;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;
