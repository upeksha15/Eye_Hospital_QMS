import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Bell, ShieldPlus, HeartPulse, Clock, Users, ClipboardList, ChevronDown, User, MapPin, Phone, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import image3 from '../assets/image3.png';

const services = [
  {
    title: 'General Eye Clinic',
    text: 'Comprehensive eye checkups for vision problems, refraction, and common eye conditions.',
    icon: <Eye className="w-6 h-6" />,
  },
  {
    title: 'Cataract & Lens Surgery',
    text: 'Modern cataract surgery with intraocular lens implantation for clearer vision.',
    icon: <ShieldPlus className="w-6 h-6" />,
  },
  {
    title: 'Retina & Vitreous Services',
    text: 'Specialised care for diabetic eye disease, retinal detachments, and macular disorders.',
    icon: <HeartPulse className="w-6 h-6" />,
  },
  {
    title: 'Glaucoma Clinic',
    text: 'Monitoring and treatment to protect the optic nerve and preserve sight.',
    icon: <Clock className="w-6 h-6" />,
  },
  {
    title: 'Paediatric Ophthalmology',
    text: 'Eye care services tailored for children, including squint and lazy eye management.',
    icon: <Users className="w-6 h-6" />,
  },
  {
    title: 'Emergency Eye Care',
    text: '24/7 emergency services for eye injuries, sudden vision loss, and urgent conditions.',
    icon: <ShieldPlus className="w-6 h-6" />,
  },
];

const ServicesPage = () => {
  const navigate = useNavigate();
  const { patient, staff, user, isAuthenticated, userType, logout } = useAuth();
  const activeUser = userType === 'patient' ? patient : (staff || user);
  const isLoggedIn = Boolean(isAuthenticated && activeUser);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="relative min-h-screen font-sans text-slate-800 w-full overflow-hidden">
      {/* Full-page blurred background image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={image3}
          alt="Services background"
          className="w-full h-full object-cover blur-sm scale-105"
        />
        <div className="absolute inset-0 bg-white/60" />
      </div>
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
          <Link to="/services" className="border-b-2 border-cyan-400 text-cyan-50">Services</Link>
          <Link to="/about" className="hover:text-cyan-50 transition-colors">About Us</Link>
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

      {/* Hero / intro */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-5">
            <h1 className="text-3xl md:text-4xl font-bold text-[#003366]">Our Eye Care Services</h1>
            <p className="text-slate-700 leading-relaxed">
              The National Eye Hospital offers a full range of specialised services, from routine checkups to
              complex surgery. Our dedicated teams work together to protect and restore sight for patients
              across Sri Lanka.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Through the Queue Management System (QMS), you can schedule appointments, view queue status,
              and spend less time waiting at the hospital.
            </p>
          </div>

          <div className="space-y-4 bg-white rounded-2xl shadow-xl border border-blue-100 p-6">
            <h2 className="text-xl font-semibold text-[#003366] flex items-center gap-2">
              <ShieldPlus className="text-blue-600" />
              How we support your visit
            </h2>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>Clear information on available clinics and services.</li>
              <li>Structured appointment times to reduce overcrowding.</li>
              <li>Real-time queue updates so you know when to attend.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">Clinical services at a glance</h2>
          <p className="mt-3 text-slate-700 max-w-2xl">
            Below is an overview of the key services provided at the National Eye Hospital. Specific clinic
            availability may vary by day.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col gap-3 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
                    {s.icon}
                  </span>
                  <h3 className="text-lg font-semibold text-[#003366]">{s.title}</h3>
                </div>
                <p className="text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to access services */}
      <section className="pb-20 px-6">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
          {[
            {
              title: '1. Register or log in',
              text: 'Create a patient account or log in using your existing details.',
            },
            {
              title: '2. Book your clinic',
              text: 'Choose the service and doctor (where available) and reserve a slot.',
            },
            {
              title: '3. Follow your queue',
              text: 'On the day of your visit, use the QMS to track your queue status.',
            },
          ].map((step) => (
            <div
              key={step.title}
              className="bg-white rounded-2xl shadow-md border border-blue-100 p-6 flex flex-col gap-2"
            >
              <h3 className="text-md font-semibold text-[#003366]">{step.title}</h3>
              <p className="text-sm text-slate-600">{step.text}</p>
            </div>
          ))}
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

export default ServicesPage;
