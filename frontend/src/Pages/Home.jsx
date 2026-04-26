import React, { useRef, useEffect, useState } from "react";
import backg1 from '../assets/backg1.png';
import eyeImg from '../assets/Eye.png'; // Transparent eye image
import doctorImg from '../assets/doctor.png'; // Doctor image
import QueueI from '../assets/queue.png'; // Queue image
import { Link, useNavigate } from "react-router-dom";

import { 
  Eye, ChevronDown, AlertTriangle, ClipboardList, Clock, ShieldPlus, Megaphone, 
  PenIcon, User, MapPin, Phone, Mail
} from 'lucide-react';
import backg2 from '../assets/backg2.png';
import backg3 from '../assets/back3g.png';
import backg4 from '../assets/back4g.png';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';


const Home = () => {

  const navigate = useNavigate();
  const { patient, isAuthenticated, userType, logout } = useAuth();
  const isPatientLoggedIn = Boolean(isAuthenticated && userType === 'patient' && patient);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const backgrounds = [backg1, backg2, backg3,backg4];
const [bgIndex, setBgIndex] = React.useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setBgIndex((prev) => (prev + 1) % backgrounds.length);
  }, 5000); // change every 5 seconds

  return () => clearInterval(interval);
}, [backgrounds.length]);


  // Special Notices fetched from backend
  const [notices, setNotices] = useState([]);
  const sliderRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/api/notices');
        const items = Array.isArray(res.data?.data) ? res.data.data : [];
        if (!cancelled) setNotices(items);
      } catch (e) {
        console.error('Failed to load notices', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Continuous scroll effect
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    let start = 0;

    function animate() {
      start -= 0.5;
      if (Math.abs(start) >= slider.scrollWidth / 2) start = 0;
      slider.style.transform = `translateX(${start}px)`;
      requestAnimationFrame(animate);
    }

    animate();
  }, [notices]);

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
          <Link to="/" className="border-b-2 border-cyan-400 text-cyan-50">Home</Link>
          <Link to="/services" className="hover:text-cyan-50 transition-colors">Services</Link>
          <Link to="/about" className="hover:text-cyan-50 transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-cyan-50 transition-colors">Contact</Link>

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

      {/* --- HERO SECTION --- */}
      <section className="relative h-[500px] overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent -z-30" />
        <img
  src={backgrounds[bgIndex]}
  alt="Hospital Background"
  className="absolute inset-0 w-screen h-screen object-cover opacity-90 transition-opacity duration-[6000ms] ease-in-out"
/>
        <div className="relative z-10 flex flex-col items-end justify-center h-full px-20 text-right">
            <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 90"
    preserveAspectRatio="xMinYMid meet"
    className="block w-full h-auto"
    role="img"
    aria-label="National Eye Hospital"
  >
    <text
      x="600"
      y="50"
      fontSize="50"
      fontWeight="900"
      fontFamily="Montserrat, 'Segoe UI', sans-serif"
      stroke="black"
      strokeWidth="3"
      strokeLinejoin="round"
      fill="#30C5FF"
    >
      National Eye Hospital
    </text>
  </svg>
          <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1200 70"
    preserveAspectRatio="xMinYMid meet"
    className="block w-full h-auto mt-1"
    role="img"
    aria-label="Queue Management System"
  >
    <text
      x="575"
      y="35"
      fontSize="45"
      fontWeight="800"
      fontFamily="Montserrat, 'Segoe UI', sans-serif"
      stroke="black"
      strokeWidth="2.5"
      strokeLinejoin="round"
      fill="white"
    >
      Queue Management System
    </text>
  </svg>

         
          {/* Removed hero action buttons (Schedule Appointment & Queue Status) as requested */}
        </div>
      </section>

      {/* --- QUICK LINKS CARDS --- */}
      <section className="w-full -mt-6 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
        {[{
          title: "Get Queue Number",
          desc: "Save time by getting your queue number online.",
          icon: <ClipboardList className="text-blue-600 w-10 h-10" />,
          bg: "bg-white/80",
        },{
          title: "Check Queue Status",
          desc: "View current queue status and estimated wait times.",
          icon: <Clock className="text-orange-600 w-10 h-10" />,
          bg: "bg-[#fee2c5]/80",
        },{
          title: "Our Services",
          desc: "Learn more about the eye care services we provide.",
          icon: <ShieldPlus className="text-blue-600 w-10 h-10" />,
          bg: "bg-white/80",
        }].map((card, idx) => (
          <div key={idx} className={`relative ${card.bg} backdrop-blur-md p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-blue-100 overflow-hidden`}>
            <img src={eyeImg} alt="Eye background" className="absolute inset-0 w-full h-full object-contain opacity-20 z-0"/>
            <div className="p-4 bg-white/30 rounded-xl z-10">{card.icon}</div>
            <div className="z-10">
              <h3 className="font-bold text-lg text-[#003366]">{card.title}</h3>
              <p className="text-sm text-slate-500">{card.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* --- MIDDLE BRANDING SECTION --- */}
      <section className="py-20 px-6 w-full mt-1 bg-[#041a3f] relative overflow-hidden">
        {/* Abstract grids from login page to blend */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(80,170,255,0.15),transparent_45%),radial-gradient(circle_at_80%_65%,rgba(20,90,180,0.25),transparent_50%)] pointer-events-none z-0" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="flex-1 relative">
            <img src={QueueI} alt="Queue background" className="w-full h-full object-contain opacity-80 drop-shadow-[0_0_30px_rgba(56,189,248,0.2)]"/>
          </div>

          <div className="flex-1 text-center lg:text-center z-10">
            <h2 className="text-4xl font-bold text-cyan-50 drop-shadow-[0_0_15px_rgba(46,174,255,0.4)]">Welcome </h2>
            <p className="mt-4 text-cyan-100/80 max-w-3xl mx-auto lg:mx-0 text-lg leading-relaxed font-light">
              Our Eye Hospital Queue Management System is designed to make your visit seamless and efficient. With just a few clicks, patients can get a queue number, track their position in real time, and schedule appointments with experienced ophthalmologists.
              <br/><br/>
              This system leverages modern technology to reduce waiting times, streamline hospital operations, and provide a smooth experience for both patients and staff. Our goal is to make quality eye care more accessible, convenient, and stress-free for everyone.
            </p>
          <div className="flex justify-center">
          <Link to="/register">          
            <button className="mt-8 relative group overflow-hidden bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-500 text-white px-10 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.55)] transition-all hover:scale-105 border border-cyan-200/80">
              <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative z-10 flex items-center gap-2">
                <PenIcon size={20} /> Register Now
              </span>
            </button>
          </Link>
          </div>
          </div>

          <div className="flex-1 relative">
            <img src={doctorImg} alt="Doctor" className="w-90 h-full object-contain drop-shadow-[0_0_30px_rgba(56,189,248,0.2)]"/>
          </div>
        </div>
      </section>

      {/* --- SPECIAL NOTICES SLIDER --- */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-white px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Megaphone className="text-blue-700 w-8 h-8 animate-pulse" />
            <h2 className="text-3xl font-bold text-[#003366]">Special Notices</h2>
          </div>

          {/* Continuous Left Scrolling */}
          <div className="overflow-hidden w-full">
            <div ref={sliderRef} className="flex whitespace-nowrap">
                {(notices.length === 0 ? [] : [...notices, ...notices]).map((notice, index) => {
                  const border = notice.priority === 'high' ? 'border-red-500' : notice.priority === 'medium' ? 'border-amber-500' : 'border-blue-500';
                  const icon = notice.priority === 'high' ? <AlertTriangle className="text-red-500" /> : <Megaphone className="text-blue-500" />;
                  return (
                    <div key={index} className="flex-shrink-0 px-6">
                      <div className={`bg-white p-6 rounded-2xl shadow-xl border-l-4 ${border} flex items-center gap-3`}>
                        {icon}
                        <div>
                          <h3 className="font-bold">{notice.title || 'Notice'}</h3>
                          <p className="text-slate-600">{notice.message || notice.text || ''}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

export default Home;
