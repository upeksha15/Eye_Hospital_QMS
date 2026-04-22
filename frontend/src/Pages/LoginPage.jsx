import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  HeartPulse,
  Shield,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ============ VALIDATION FUNCTIONS ============

  // Helper: Check if email ends with a valid TLD
  const hasValidTLD = (email) => {
    const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'jp', 'cn', 'in', 'br', 'mx', 'info', 'biz', 'io', 'ai', 'dev', 'app', 'lk'];
    const parts = email.toLowerCase().split('.');
    if (parts.length >= 2) {
      const tld = parts[parts.length - 1];
      return validTLDs.includes(tld) && tld.length >= 2;
    }
    return false;
  };

  // Email Validation
  const validateEmail = (value) => {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return "Email is required";
    }
    if (trimmed.length > 254) {
      return "Email must not exceed 254 characters";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return "Email must be in the format: user@domain.com";
    }
    return "";
  };

  // Password Validation
  const validatePassword = (value) => {
    if (!value) {
      return "Password is required";
    }
    if (value.length < 6) {
      return "Password must be at least 6 characters";
    }
    return "";
  };

  // ============ EVENT HANDLERS ============

  const handleEmailChange = (e) => {
    const value = e.target.value.trim();
    
    // Prevent typing after complete TLD (3+ characters only)
    if (email && value.length > email.length) {
      const parts = email.toLowerCase().split('.');
      if (parts.length >= 2) {
        const tld = parts[parts.length - 1];
        // Only block if TLD is 3+ characters (com, org, edu, etc.)
        if (tld.length >= 3 && hasValidTLD(email)) {
          return;
        }
      }
    }
    
    setEmail(value);
    
    // Real-time validation
    const error = validateEmail(value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, email: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
    setError('');
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Real-time validation
    const error = validatePassword(value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, password: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        return newErrors;
      });
    }
    setError('');
  };

  const roles = [
    {
      value: 'patient',
      label: 'Patient',
      icon: HeartPulse,
      description: 'Sign in with the email and password you used when registering.',
    },
    {
      value: 'admin',
      label: 'Admin',
      icon: Shield,
      description: 'Administrator login issued by your hospital (Staff accounts). Pick Admin only if your account is admin.',
    },
    {
      value: 'medical_staff',
      label: 'Medical Staff',
      icon: Stethoscope,
      description: 'Staff login issued by your administrator. Must match the role on your account.',
    },
  ];
  const roleActiveClasses = {
    patient: 'border-violet-200/80 bg-violet-500/25 shadow-[0_0_16px_rgba(139,92,246,0.5)]',
    admin: 'border-amber-200/80 bg-amber-500/25 shadow-[0_0_16px_rgba(245,158,11,0.5)]',
    medical_staff: 'border-sky-200/80 bg-sky-500/25 shadow-[0_0_16px_rgba(14,165,233,0.5)]',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    // Validate fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      if (emailError) setFieldErrors(prev => ({ ...prev, email: emailError }));
      if (passwordError) setFieldErrors(prev => ({ ...prev, password: passwordError }));
      return;
    }

    setLoading(true);
    try {
      const data = await login({ email: email.trim().toLowerCase(), password, role });
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
    <div className="h-screen overflow-hidden bg-[#041a3f] text-white">
      <div className="grid h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative flex h-screen items-center justify-center overflow-hidden px-4 py-4 sm:px-8">
          <div className="absolute inset-0 login-blue-grid" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,170,255,0.2),transparent_45%),radial-gradient(circle_at_80%_65%,rgba(20,90,180,0.35),transparent_50%)]" />

          <div className="relative z-10 w-full max-w-sm">
            <div className="mb-4 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="mx-auto mb-3 inline-flex h-14 w-14 translate-y-1 items-center justify-center rounded-full border border-cyan-200/40 bg-cyan-400/10 shadow-[0_0_20px_rgba(46,174,255,0.45)]"
                aria-label="Go to home page"
              >
                <Eye className="h-7 w-7 text-cyan-200" />
              </button>
              <p className="text-2xl font-medium tracking-wide text-cyan-50">Welcome Back</p>
            </div>

            <div className="rounded-2xl border border-cyan-100/20 bg-white/10 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
              <label className="mb-3 block text-sm font-semibold text-cyan-50/95">Select Your Role</label>
              <div className="mb-4 grid grid-cols-3 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon;
                  const selected = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`rounded-xl border px-2 py-3 text-center transition-all duration-300 ${
                        selected
                          ? roleActiveClasses[r.value]
                          : 'border-cyan-100/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="mx-auto mb-1 h-4 w-4 text-cyan-100" />
                      <span className="text-[11px] font-semibold text-cyan-50/95">{r.label}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-cyan-50/90">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/70" />
                    <input
                      id="email"
                      type="text"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`h-11 w-full rounded-lg border bg-slate-900/20 pl-10 pr-3 text-sm text-white placeholder:text-cyan-100/40 focus:border-cyan-300/50 focus:outline-none ${
                        fieldErrors.email ? 'border-red-400/80' : 'border-cyan-100/25'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && <p className="mt-1 text-xs text-red-300">{fieldErrors.email}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm text-cyan-50/90">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-100/70" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="********"
                      className={`h-11 w-full rounded-lg border bg-slate-900/20 pl-10 pr-10 text-sm text-white placeholder:text-cyan-100/40 focus:border-cyan-300/50 focus:outline-none ${
                        fieldErrors.password ? 'border-red-400/80' : 'border-cyan-100/25'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-100/70 hover:text-cyan-50"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-xs text-red-300">{fieldErrors.password}</p>}
                </div>

                {error && <p className="rounded-lg border border-red-400/60 bg-red-500/20 p-2 text-xs text-red-200">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-cyan-200/80 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-sm font-semibold text-white shadow-[0_0_20px_rgba(56,189,248,0.55)] transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? 'Logging in...' : <><LogIn className="h-4 w-4" /> Sign In</>}
                  </span>
                </button>
              </form>

              <div className="mt-3 flex items-center justify-between text-xs text-cyan-100/80">
                <div className="flex items-center gap-1">
                  <span>New patients?</span>
                  <Link to="/register" className="font-semibold text-cyan-100 underline decoration-cyan-200/70">
                    Register here
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-cyan-100/75 hover:text-cyan-50"
                >
                  Forgot password?
                </button>
              </div>
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

export default LoginPage;