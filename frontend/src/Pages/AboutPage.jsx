import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Bell, ShieldPlus, Users, HeartPulse, ClipboardList, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import image1 from '../assets/image1.png';
import image2 from '../assets/image2.png';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.png';

const AboutPage = () => {
  const navigate = useNavigate();
  const { patient, staff, user, isAuthenticated, userType, logout } = useAuth();
  const activeUser = userType === 'patient' ? patient : (staff || user);
  const isLoggedIn = Boolean(isAuthenticated && activeUser);
  const slides = [image1, image2, image3, image4];
  const [slideIndex, setSlideIndex] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-[#f0f7ff] font-sans text-slate-800 w-full">
      {/* Navbar reused style */}
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
          <span className="border-b-2 border-blue-600">About Us</span>
          <Link to="/contact" className="hover:text-blue-700">Contact</Link>
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

      {/* Hero with horizontal slideshow of 4 images (no text overlay) */}
      <section className="relative h-[400px] overflow-hidden w-full">
        <div className="absolute inset-0 overflow-hidden z-0">
          <div
            className="flex h-full transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${slideIndex * 100}%)` }}
          >
            {slides.map((src, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0">
                <img
                  src={src}
                  alt="Hospital and eye care"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 via-transparent to-transparent" />
        </div>
      </section>

      {/* Content section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-2 items-start">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold text-[#003366]">Who We Are</h2>
            <p className="text-slate-700 leading-relaxed">
              The National Eye Hospital is a centre of excellence for eye care in Sri Lanka. Our consultants,
              nurses, and staff work together to provide safe, evidence-based treatment for a wide range of
              eye conditions – from routine checkups to complex surgery.
            </p>
            <p className="text-slate-700 leading-relaxed">
              With the Queue Management System (QMS), we reduce waiting times, improve transparency, and give
              patients more control over their visit by allowing them to view queue status in real time and
              manage appointments online.
            </p>
          </div>

          <div className="space-y-5 bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
            <h3 className="text-2xl font-semibold text-[#003366] flex items-center gap-2">
              <ShieldPlus className="text-blue-600" />
              Our Mission & Values
            </h3>
            <ul className="space-y-3 text-slate-700 text-sm leading-relaxed">
              <li>
                <strong className="text-[#003366]">Patient-first care:</strong> ensuring every patient feels
                heard, respected, and supported throughout their journey.
              </li>
              <li>
                <strong className="text-[#003366]">Clinical excellence:</strong> combining experienced
                specialists with modern equipment and protocols.
              </li>
              <li>
                <strong className="text-[#003366]">Efficiency with compassion:</strong> using technology like
                QMS to cut queues while maintaining a human touch.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Stats / highlights */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col items-start gap-2">
            <Users className="text-blue-600 w-7 h-7" />
            <p className="text-3xl font-bold text-[#003366]">100K+</p>
            <p className="text-sm text-slate-600">patients served annually through our clinics.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col items-start gap-2">
            <Eye className="text-blue-600 w-7 h-7" />
            <p className="text-3xl font-bold text-[#003366]">40+</p>
            <p className="text-sm text-slate-600">specialist ophthalmologists across key sub-specialties.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col items-start gap-2">
            <HeartPulse className="text-blue-600 w-7 h-7" />
            <p className="text-3xl font-bold text-[#003366]">24/7</p>
            <p className="text-sm text-slate-600">emergency coverage for urgent eye conditions.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
