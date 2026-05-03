import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Bell, ChevronDown, User, ClipboardList, MapPin, Phone, Mail } from 'lucide-react';
import { fetchFeedback } from '../api/feedbackApi';
import { useAuth } from '../hooks/useAuth';
import bgImage from '../assets/image5.png';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { patient, staff, user, isAuthenticated, userType, logout } = useAuth();
  const activeUser = userType === 'patient' ? patient : (staff || user);
  const isLoggedIn = Boolean(isAuthenticated && activeUser);
  const isPatientLoggedIn = Boolean(isAuthenticated && userType === 'patient' && patient);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchFeedback();
        if (mounted && data?.success) {
          setItems(data.feedback || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div 
      className="min-h-screen flex flex-col font-sans text-slate-800 w-full relative bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Navbar from Home */}
      <nav className="flex items-center justify-between px-12 py-4 bg-[#041a3f]/90 backdrop-blur-xl border-b border-cyan-100/10 sticky top-0 z-50 w-full shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="p-1.5 border border-cyan-200/40 bg-cyan-400/10 shadow-[0_0_15px_rgba(46,174,255,0.3)] rounded-full">
              <Eye className="text-cyan-200 w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-cyan-50 tracking-wide">Sri Lanka National Eye Hospital Colombo</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <img
                src="https://flagcdn.com/w40/lk.png"
                alt="Sri Lanka Flag"
                style={{
                  animation: "wave 2s infinite ease-in-out",
                  transformOrigin: "left center"
                }}
                className="w-14 h-7"
              />
            </div>
            <style>
              {`
              @keyframes wave {
                0% { transform: rotate(0deg); }
                50% { transform: rotate(4deg); }
                100% { transform: rotate(0deg); }
              }
              `}
            </style>
          </div>
        </div>
        <div className="flex items-center gap-8 font-semibold text-cyan-100/90">
          <Link to="/" className="hover:text-cyan-50 transition-colors">Home</Link>
          <Link to="/services" className="hover:text-cyan-50 transition-colors">Services</Link>
          <Link to="/about" className="hover:text-cyan-50 transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-cyan-50 transition-colors">Contact</Link>

          {/* Right side: Login button (guest) or patient profile (logged-in) */}
          {!isLoggedIn ? (
            <Link to="/login">
              <button className="relative group overflow-hidden bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-[0_0_20px_rgba(56,189,248,0.55)] transition-all hover:scale-105 border border-cyan-200/80">
                <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative z-10">Login</span>
              </button>
            </Link>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl border border-cyan-100/20 bg-white/5 hover:bg-white/10 transition backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-cyan-300/50 bg-cyan-900/40 flex items-center justify-center">
                  {patient?.profileImage && !avatarError ? (
                    <img
                      src={patient.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <User className="w-5 h-5 text-cyan-200" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-cyan-50 leading-tight">
                    {activeUser?.fullName || activeUser?.name || 'User'}
                  </p>
                  <p className="text-xs text-cyan-100/70 leading-tight">
                    {activeUser?.email || activeUser?.nic || ''}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-cyan-100/70" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#07214c] shadow-[0_18px_60px_rgba(0,0,0,0.5)] border border-cyan-100/20 py-2 text-sm text-cyan-50 backdrop-blur-xl">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-2 transition-colors"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                  >
                    <ClipboardList className="w-4 h-4 text-cyan-200" />
                    Dashboard
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-white/10 flex items-center gap-2 border-t border-cyan-100/10 mt-1 pt-2 transition-colors"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                  >
                    <User className="w-4 h-4 text-cyan-200" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <section className="pt-8 pb-16 px-6 relative z-10 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Topic formatting from ContactPage */}
          <div className="text-center mb-8 mx-auto w-full max-w-2xl bg-white/40 backdrop-blur-lg border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.08)] rounded-2xl py-4 px-6 md:px-8 md:py-5">
            <p className="text-xs font-bold tracking-wider text-blue-600 uppercase">Patient Reviews</p>
            <h1 className="mt-1.5 text-2xl md:text-3xl font-bold text-[#003366]">Feedback</h1>
            <p className="mt-2 text-slate-800 text-sm md:text-[14px] leading-relaxed max-w-lg mx-auto">
              See feedback and ratings shared by patients about the Queue Management System and clinics.
            </p>
          </div>

          {/* Feedback Items Section - Preserved exactly as requested */}
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 p-6 text-slate-700">
            {loading ? (
              <p className="text-sm text-center">Loading feedback...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-center">No feedback to display yet.</p>
            ) : (
              <div className="space-y-4">
                {items.map((fb) => (
                  <div
                    key={fb._id}
                    className="border border-slate-100 rounded-xl p-4 shadow-sm bg-slate-50/60 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#003366]">
                        {fb.patientName || 'Patient'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <div className="flex items-center text-yellow-400 text-lg">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx} className={idx < (fb.rating || 0) ? '' : 'text-slate-300'}>
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                      {fb.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer from ContactPage */}
      <footer className="bg-[#021028] border-t border-cyan-100/10 text-cyan-50 pt-10 pb-6 w-full relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 border border-cyan-200/40 bg-cyan-400/10 shadow-[0_0_10px_rgba(46,174,255,0.3)] rounded-full inline-flex">
                <Eye className="text-cyan-200 w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-cyan-50">About Eye Hospital</h3>
            </div>
            <p className="text-sm text-cyan-100/70 leading-relaxed">
              We provide specialized eye care services with a dedicated team of doctors and staff.
              Our Queue Management System helps you save time and manage your visit easily.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-cyan-50">Quick Links</h3>
            <ul className="space-y-2 text-sm text-cyan-100/70">
              <li><Link to="/" className="hover:text-cyan-300 transition-colors">Home</Link></li>
              <li><Link to="/services" className="hover:text-cyan-300 transition-colors">Services</Link></li>
              <li><Link to="/about" className="hover:text-cyan-300 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-cyan-300 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 text-cyan-50">Contact Us</h3>
            <p className="text-sm text-cyan-100/70 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-400" /> 123 Eye Care Street, Colombo, Sri Lanka</p>
            <p className="text-sm text-cyan-100/70 mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-cyan-400" /> +94 11 123 4567</p>
            <p className="text-sm text-cyan-100/70 flex items-center gap-2"><Mail className="w-4 h-4 text-cyan-400" /> info@eyehospital.lk</p>
          </div>
        </div>
        <div className="text-center text-cyan-100/50 mt-12 text-sm border-t border-cyan-100/10 pt-6">
          &copy; {new Date().getFullYear()} Eye Hospital. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default FeedbackPage;
