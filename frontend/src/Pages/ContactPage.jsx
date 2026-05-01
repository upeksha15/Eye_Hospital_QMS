import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, MapPin, Phone, Mail, Clock, ClipboardList, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { submitFeedback } from '../api/feedbackApi';

function isFeedbackValid(text) {
  const value = (text || '').trim();
  if (!value) return false;

  // At least 5 alphabetic letters
  const letters = value.match(/[A-Za-z]/g) || [];
  if (letters.length < 5) return false;

  // Disallow digits; symbols/punctuation are allowed
  if (/\d/.test(value)) return false;

  return true;
}

const ContactPage = () => {
  const navigate = useNavigate();
  const { patient, staff, user, isAuthenticated, userType, logout } = useAuth();
  const activeUser = userType === 'patient' ? patient : (staff || user);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const canSubmitFeedback = isAuthenticated && userType === 'patient';
  const isLoggedIn = Boolean(isAuthenticated && activeUser);
  const feedbackIsValid = isFeedbackValid(feedback);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmitFeedback) {
      setShowAuthPrompt(true);
      return;
    }

    if (!rating || !feedback.trim()) {
      return;
    }

    if (!isFeedbackValid(feedback)) {
      setSubmitError('Feedback must contain at least 5 letters and no numbers.');
      return;
    }

    try {
      setSubmitError('');
      await submitFeedback({ message: feedback.trim(), rating });
      setRating(0);
      setFeedback('');
      navigate('/feedback');
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Failed to submit feedback. Please try again.';
      setSubmitError(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f7ff] font-sans text-slate-800 w-full">
      {/* Navbar */}
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
          <Link to="/contact" className="border-b-2 border-cyan-400 text-cyan-50">Contact</Link>

          {/* Right side: Login button (guest) or patient profile (logged-in) */}
          {!isPatientLoggedIn ? (
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
                      src={activeUser.profileImage}
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
                    {patient?.fullName || 'Patient'}
                  </p>
                  <p className="text-xs text-cyan-100/70 leading-tight">
                    {patient?.email || patient?.nic || ''}
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
                      if (userType === 'staff') {
                        navigate(activeUser?.role === 'admin' ? '/admin' : '/staffdashboard');
                      } else {
                        navigate('/dashboard');
                      }
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

      {/* Contact content */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-wide text-blue-600 uppercase">We are here to help</p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[#003366]">Contact the National Eye Hospital</h1>
            <p className="mt-4 text-slate-700 max-w-2xl mx-auto">
              Reach us for questions about clinics, appointments, or the Queue Management System. Our staff
              will guide you to the right service.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-2 items-start">
            <div className="space-y-5">
              <div className="space-y-4 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 p-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h2 className="font-semibold text-[#003366]">Hospital Address</h2>
                  <p className="text-sm text-slate-700">
                    123 Eye Care Street,<br />
                    Colombo, Sri Lanka
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h2 className="font-semibold text-[#003366]">Telephone</h2>
                  <p className="text-sm text-slate-700">+94 11 123 4567</p>
                  <p className="text-sm text-slate-700">+94 11 765 4321</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h2 className="font-semibold text-[#003366]">Email</h2>
                  <p className="text-sm text-slate-700">info@eyehospital.lk</p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                <Clock className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h2 className="font-semibold text-[#003366]">Working Hours</h2>
                  <p className="text-sm text-slate-700">
                    Outpatient clinics: Monday to Friday, 8.00 AM – 4.00 PM<br />
                    Emergency services: 24 hours, 7 days a week
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-slate-700">
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                  <p className="font-semibold text-[#003366]">OPD</p>
                  <p>Mon–Fri, 8.00 AM – 4.00 PM</p>
                </div>
                <div className="bg-sky-50 rounded-xl px-4 py-3">
                  <p className="font-semibold text-[#003366]">Clinics</p>
                  <p>By appointment only</p>
                </div>
                <div className="bg-indigo-50 rounded-xl px-4 py-3">
                  <p className="font-semibold text-[#003366]">Emergency</p>
                  <p>24 hours / 7 days</p>
                </div>
              </div>
            </div>
          </div>

            <div className="space-y-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100 p-6">
              <h2 className="text-xl font-semibold text-[#003366]">Feedback - add your rating</h2>
              <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your feedback</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/70 shadow-sm"
                  placeholder="Share your experience or suggestions here"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                {feedback && !feedbackIsValid && (
                  <p className="mt-1 text-xs text-red-500">
                    Feedback must contain at least 5 letters and no numbers.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-3xl focus:outline-none"
                    >
                      <span
                        className={`${(hoverRating || rating) >= star ? 'text-yellow-400' : 'text-slate-300'}`}
                      >
                        ★
                      </span>
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate-600">
                    {rating ? `${rating} out of 5` : 'Tap a star to rate'}
                  </span>
                </div>
              </div>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#2d9d78] px-8 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#248263] hover:shadow-lg transition-transform transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!rating || !feedback.trim() || !feedbackIsValid}
              >
                Add Feedback
              </button>
              {showAuthPrompt && (
                <div className="mt-3 text-xs bg-yellow-50 border border-yellow-300 rounded-lg p-3 space-y-2 text-slate-700">
                  <p className="font-semibold text-yellow-800">
                    Only patients can add feedbacks!
                  </p>
                </div>
              )}
              {submitError && (
                <p className="mt-2 text-xs text-red-500">
                  {submitError}
                </p>
              )}
              <div className="mt-3">
                <Link
                  to="/feedback"
                  className="inline-flex items-center justify-center rounded-lg border border-[#2d9d78] px-6 py-2 text-sm font-semibold text-[#2d9d78] bg-white hover:bg-[#e6f6f1] transition"
                >
                  View all feedback
                </Link>
              </div>
              <p className="text-xs text-slate-500">
                This is an information form only. Do not use it for medical emergencies. For urgent problems,
                please attend the emergency department directly.
              </p>
            </form>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
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
            <p className="text-sm text-cyan-100/70 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-400"/> 123 Eye Care Street, Colombo, Sri Lanka</p>
            <p className="text-sm text-cyan-100/70 mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-cyan-400"/> +94 11 123 4567</p>
            <p className="text-sm text-cyan-100/70 flex items-center gap-2"><Mail className="w-4 h-4 text-cyan-400"/> info@eyehospital.lk</p>
          </div>
        </div>
        <div className="text-center text-cyan-100/50 mt-12 text-sm border-t border-cyan-100/10 pt-6">
          &copy; {new Date().getFullYear()} Eye Hospital. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
