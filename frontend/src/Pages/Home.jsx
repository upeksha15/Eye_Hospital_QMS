import React, { useRef, useEffect, useState } from "react";
import backg1 from '../assets/backg1.png';
import eyeImg from '../assets/Eye.png'; // Transparent eye image
import doctorImg from '../assets/doctor.png'; // Doctor image
import QueueI from '../assets/queue.png'; // Queue image
import { Link, useNavigate } from "react-router-dom";

import { 
  Eye, Bell, ChevronDown, AlertTriangle, ClipboardList, Clock, ShieldPlus, Megaphone, 
  PenIcon, User
} from 'lucide-react';
import backg2 from '../assets/backg2.png';
import backg3 from '../assets/back3g.png';
import backg4 from '../assets/back4g.png';
import { useAuth } from '../hooks/useAuth';


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
}, []);


  // Special Notices
  const notices = [
    { title: "Clinic Closure", text: "Eye clinic will be closed on Poya Day due to public holiday.", icon: <AlertTriangle className="text-red-500" />, border: "border-red-500" },
    { title: "Doctor Availability", text: "Retina specialist available from 9.00 AM – 1.00 PM today.", icon: <Eye className="text-blue-500" />, border: "border-blue-500" },
    { title: "Emergency Services", text: "Emergency eye care services are available 24/7.", icon: <ShieldPlus className="text-green-500" />, border: "border-green-500" },
  ];

  const extendedNotices = [...notices, ...notices]; // duplicate for infinite scroll
  const sliderRef = useRef(null);

  // Continuous scroll effect
  useEffect(() => {
    const slider = sliderRef.current;
    let start = 0;

    function animate() {
      start -= 0.5; // move left 1px per frame
      if (Math.abs(start) >= slider.scrollWidth / 2) start = 0;
      slider.style.transform = `translateX(${start}px)`;
      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f7ff] font-sans text-slate-800 w-full">

      {/* --- NAVBAR --- */}
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
        <div className="flex items-center gap-8 font-semibold text-[#004a99]">
          <Link to="/" className="border-b-2 border-blue-600">Home</Link>
          <Link to="/services">Services</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Bell className="w-6 h-6 text-slate-600 cursor-pointer" />

          {/* Right side: Login button (guest) or patient profile (logged-in) */}
          {!isPatientLoggedIn ? (
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
                  {patient?.profileImage && !avatarError ? (
                    <img
                      src={patient.profileImage}
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
                    {patient?.fullName || 'Patient'}
                  </p>
                  <p className="text-xs text-slate-500 leading-tight">
                    {patient?.email || patient?.nic || ''}
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
                      navigate('/dashboard');
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
      <section className="py-20 px-6 w-full mt-1">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 relative">
            <img src={QueueI} alt="Queue background" className="w-full h-full object-contain opacity-70"/>
          </div>

          <div className="flex-1 text-center lg:text-center z-10">
            <h2 className="text-4xl font-bold text-[#003366]">Welcome </h2>
            <p className="mt-4 text-slate-600 max-w-3xl mx-auto lg:mx-0 text-lg leading-relaxed">
              Our Eye Hospital Queue Management System is designed to make your visit seamless and efficient. With just a few clicks, patients can get a queue number, track their position in real time, and schedule appointments with experienced ophthalmologists.

            This system leverages modern technology to reduce waiting times, streamline hospital operations, and provide a smooth experience for both patients and staff. Our goal is to make quality eye care more accessible, convenient, and stress-free for everyone.
            </p>
          <div className="flex justify-center">
          <Link to="/register">          
  <button className="mt-8 bg-[#2d9d78] text-white px-10 py-3 rounded-lg font-bold flex items-center gap-2 shadow-md">
    <PenIcon size={20} /> Register Now
  </button>
  </Link>
</div>


          </div>

          <div className="flex-1 relative">
            <img src={doctorImg} alt="Doctor" className="w-90 h-full object-contain"/>
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
              {extendedNotices.map((notice, index) => (
                <div key={index} className="flex-shrink-0 px-6">
                  <div className={`bg-white p-6 rounded-2xl shadow-xl border-l-4 ${notice.border} flex items-center gap-3`}>
                    {notice.icon}
                    <div>
                      <h3 className="font-bold">{notice.title}</h3>
                      <p className="text-slate-600">{notice.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#004a99] text-white mt-8 pt-4 pb-2 w-full">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6">
          <div>
            <h3 className="font-bold text-lg mb-4">About Eye Hospital</h3>
            <p className="text-sm text-white/80 leading-relaxed">
              We provide specialized eye care services with a dedicated team of doctors and staff. 
              Our Queue Management System helps you save time and manage your visit easily.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:underline">Home</Link></li>
              <li><Link to="/services" className="hover:underline">Services</Link></li>
              <li><Link to="/about" className="hover:underline">About Us</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <p className="text-sm text-white/80 mb-2">123 Eye Care Street, Colombo, Sri Lanka</p>
            <p className="text-sm text-white/80 mb-2">+94 11 123 4567</p>
            <p className="text-sm text-white/80">info@eyehospital.lk</p>
          </div>
        </div>
        <div className="text-center text-white/70 mt-8 text-sm">
          &copy; {new Date().getFullYear()} Eye Hospital. All rights reserved.
        </div>
      </footer>

    </div>
  );
};

export default Home;
