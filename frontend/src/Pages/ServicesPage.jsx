import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Bell, ShieldPlus, HeartPulse, Clock, Users, ClipboardList, ChevronDown, User } from 'lucide-react';
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
          <span className="border-b-2 border-blue-600">Services</span>
          <Link to="/about" className="hover:text-blue-700">About Us</Link>
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
    </div>
  );
};

export default ServicesPage;
