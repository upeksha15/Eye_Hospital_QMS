import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import backg1 from '../assets/backg1.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const roles = [
    {
      value: 'patient',
      label: 'Patient',
      icon: '👤',
      description: 'Sign in with the email and password you used when registering.',
    },
    {
      value: 'admin',
      label: 'Admin',
      icon: '⚙️',
      description: 'Administrator login issued by your hospital (Staff accounts). Pick Admin only if your account is admin.',
    },
    {
      value: 'medical_staff',
      label: 'Medical Staff',
      icon: '👨‍⚕️',
      description: 'Staff login issued by your administrator. Must match the role on your account.',
    },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const data = await login({ email: email.trim(), password, role });
      const u = data?.user || data?.patient;
      if (u?.userType === 'staff') {
        if (u.role === 'admin') {
          navigate('/admin');
        } else if (u.role === 'medical_staff' || u.role === 'medical-staff') {
          navigate('/staffdashboard');
        } else {
          navigate('/staffmanagement');
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${backg1})`,
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Background image now displayed clearly without overlay */}

      <div className="w-full max-w-md relative z-10">
        {/* Header Section with Home-style Eye Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-full shadow-lg mb-3 border border-white/30 hover:bg-white/20 transition-transform hover:scale-110"
            aria-label="Go to home page"
          >
            <div className="p-1.5 bg-blue-600 rounded-full">
              <Eye className="text-white w-7 h-7" />
            </div>
          </button>
          <p className="text-white/90 text-lg drop-shadow-md">Welcome Back</p>
        </div>

        {/* Main Card with Glass Morphism */}
        <div className="bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {/* Role Selection */}
          <div className="p-8 border-b border-white/10">
            <label className="block text-lg font-semibold text-white/90 mb-4">Select Your Role</label>
            <div className="grid grid-cols-3 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`relative p-3 rounded-xl transition-all duration-300 ${
                    role === r.value
                      ? `${
                          r.value === 'patient'
                            ? 'bg-purple-500'
                            : r.value === 'admin'
                            ? 'bg-orange-500'
                            : 'bg-sky-500'
                        } backdrop-blur-md text-white shadow-lg scale-105 border-white/50`
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  } border`}
                >
                  <div className="text-lg mb-1">{r.icon}</div>
                  <div className="text-xs font-semibold whitespace-nowrap">{r.label}</div>
                </button>
              ))}
            </div>
            {role && (
              <p className="text-xs text-white/70 mt-3 text-center">
                {roles.find(r => r.value === role)?.description}
              </p>
            )}
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-white/90 mb-2">
                Email Address
              </label>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === 'email' ? 'ring-2 ring-white/50 rounded-xl' : ''
                }`}
              >
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:bg-white/30 transition-colors duration-300 text-white placeholder-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white/90 mb-2">
                Password
              </label>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === 'password' ? 'ring-2 ring-white/50 rounded-xl' : ''
                }`}
              >
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 bg-white/20 border border-white/30 rounded-xl focus:outline-none focus:bg-white/30 transition-colors duration-300 text-white placeholder-white/50 backdrop-blur-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-white/80 hover:text-white underline-offset-2 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/30 border-l-4 border-red-400 rounded-lg animate-shake backdrop-blur-sm">
                <p className="text-white text-sm font-medium flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg border border-blue-500 backdrop-blur-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin">⏳</div>
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>

            {/* Help Text */}
            <div className="text-center text-sm text-white/90 space-y-2">
              <p>
                New patients:{' '}
                <Link to="/register" className="font-semibold text-white hover:text-white/80 transition-colors underline">
                  Register here
                </Link>
              </p>
              <p className="text-xs text-white/70 pt-2">
                Staff and admin accounts are not self-service — they are created under Admin → Staff accounts.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-white/80">
          <p>Protected by enterprise-grade security</p>
          <div className="flex justify-center gap-4 mt-3">
            <span className="text-xs">🔒 Encrypted</span>
            <span className="text-xs">✓ Verified</span>
            <span className="text-xs">🛡️ Secure</span>
          </div>
        </div>
      </div>

      {/* Floating animation styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        input:focus::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default LoginPage;