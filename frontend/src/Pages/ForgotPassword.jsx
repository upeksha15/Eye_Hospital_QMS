import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';
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
        <form onSubmit={handleSendEmail} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">Registered Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:bg-white/30 text-white placeholder-white/50 backdrop-blur-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg border border-blue-500 backdrop-blur-sm"
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      );
    }

    if (step === 2) {
      return (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2">Enter OTP</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit code"
                className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:bg-white/30 text-white placeholder-white/50 backdrop-blur-sm tracking-[0.3em] text-center"
              />
            </div>
            <p className="text-xs text-white/70 mt-2">Enter the OTP sent to {email}.</p>
          </div>
          <div className="flex justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all duration-300"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 shadow-lg border border-blue-500 backdrop-blur-sm"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-2">New Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:bg-white/30 text-white placeholder-white/50 backdrop-blur-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-white/90 mb-2">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:bg-white/30 text-white placeholder-white/50 backdrop-blur-sm"
            />
          </div>
        </div>
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/30 transition-all duration-300"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 shadow-lg border border-blue-500 backdrop-blur-sm"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${backg1})`,
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center mb-6 text-white/90">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="inline-flex items-center justify-center p-2 bg-white/10 backdrop-blur-md rounded-full shadow-md border border-white/30 hover:bg-white/20 transition-transform hover:scale-110 mr-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Forgot Password</h1>
            <p className="text-xs text-white/80 mt-1">
              {step === 1 && 'Enter your registered email to receive an OTP.'}
              {step === 2 && 'Enter the OTP we sent to your email.'}
              {step === 3 && 'Set a new password for your account.'}
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6 text-xs text-white/80">
            <div className={`flex-1 flex items-center ${step >= 1 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${step >= 1 ? 'bg-blue-500' : 'bg-white/20'}`}>
                1
              </div>
              Email
            </div>
            <div className="w-6 h-[2px] bg-white/30 mx-1" />
            <div className={`flex-1 flex items-center ${step >= 2 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${step >= 2 ? 'bg-blue-500' : 'bg-white/20'}`}>
                2
              </div>
              OTP
            </div>
            <div className="w-6 h-[2px] bg-white/30 mx-1" />
            <div className={`flex-1 flex items-center ${step >= 3 ? 'text-white' : 'text-white/50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs font-bold ${step >= 3 ? 'bg-blue-500' : 'bg-white/20'}`}>
                3
              </div>
              New Password
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/30 border-l-4 border-red-400 rounded-lg text-xs text-white flex items-start gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/30 border-l-4 border-emerald-400 rounded-lg text-xs text-white flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
