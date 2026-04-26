import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Bell, ShieldPlus, Users, HeartPulse, ClipboardList, ChevronDown, User, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import image1 from '../assets/image1.png';
import image2 from '../assets/image2.png';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.png';

const AboutPage = () => {
  const navigate = useNavigate();
  const { patient, isAuthenticated, userType, logout } = useAuth();
  const isPatientLoggedIn = Boolean(isAuthenticated && userType === 'patient' && patient);
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
      {/* --- NAVBAR --- */}
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
        </div>
        <div className="flex items-center gap-8 font-semibold text-cyan-100/90">
          <Link to="/" className="hover:text-cyan-50 transition-colors">Home</Link>
          <Link to="/services" className="hover:text-cyan-50 transition-colors">Services</Link>
          <span className="border-b-2 border-cyan-400 text-cyan-50">About Us</span>
          <Link to="/contact" className="hover:text-cyan-50 transition-colors">Contact</Link>
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
                className="flex items-center gap-3 px-3 py-2 rounded-xl border border-cyan-100/20 bg-[#07214c] hover:bg-[#07214c]/80 transition backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
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
    {/* --- FOOTER --- */}
      <footer className="bg-[#021028] border-t border-cyan-100/10 text-cyan-50 pt-10 pb-6 w-full relative z-10">
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

export default AboutPage;
