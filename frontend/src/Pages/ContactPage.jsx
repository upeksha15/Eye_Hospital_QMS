import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Bell, MapPin, Phone, Mail, Clock, ClipboardList, ChevronDown, User } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-sky-50 to-indigo-50 font-sans text-slate-800 w-full">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-12 py-4 bg-white shadow-sm sticky top-0 z-50 w-full">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="p-1.5 bg-blue-600 rounded-full">
              <Eye className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-[#004a99]">Sri Lanka National Eye Hospital Colombo</span>
          </button>
        </div>
        <div className="flex items-center gap-8 font-semibold text-[#004a99]">
          <Link to="/" className="hover:text-blue-700">Home</Link>
          <Link to="/services" className="hover:text-blue-700">Services</Link>
          <Link to="/about" className="hover:text-blue-700">About Us</Link>
          <span className="border-b-2 border-blue-600">Contact</span>
          <Bell className="w-6 h-6 text-slate-600" />
          {!isLoggedIn ? (
            <Link to="/login">
              <button className="bg-[#2d9d78] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#248263] transition">
                Login
              </button>
            </Link>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((o) => !o)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-blue-100 bg-blue-50/70 hover:bg-blue-100 transition"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#2d9d78] bg-[#e0f7f0] flex items-center justify-center">
                  {activeUser?.profileImage && !avatarError ? (
                    <img
                      src={activeUser.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <User className="w-5 h-5 text-[#2d9d78]" />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#004a99] leading-tight">
                    {activeUser?.fullName || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 leading-tight">
                    {activeUser?.email || activeUser?.nic || userType}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg bg-white shadow-lg border border-slate-100 py-1 text-sm text-slate-700">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      if (userType === 'staff') {
                        navigate(activeUser?.role === 'admin' ? '/admin' : '/staffdashboard');
                      } else {
                        navigate('/dashboard');
                      }
                    }}
                  >
                    <ClipboardList className="w-4 h-4 text-slate-500" />
                    Dashboard
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                      navigate('/');
                    }}
                  >
                    <User className="w-4 h-4 text-slate-500" />
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
    </div>
  );
};

export default ContactPage;
