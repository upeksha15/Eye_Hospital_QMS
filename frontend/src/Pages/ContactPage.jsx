import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Bell, MapPin, Phone, Mail, Clock } from 'lucide-react';

const ContactPage = () => {
  const navigate = useNavigate();

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
              <h2 className="text-xl font-semibold text-[#003366]">Send us your feedback</h2>
              <p className="text-sm text-slate-700">
                For general enquiries or feedback about clinics or the Queue Management System, you can use this
                form. A staff member will contact you using the details you provide if a response is needed.
              </p>
              <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 shadow-sm"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email or phone</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70 shadow-sm"
                  placeholder="you@example.com / +94..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Feedback / Message</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm h-28 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/70 shadow-sm"
                  placeholder="Type your feedback or message here"
                />
              </div>
              <button
                type="button"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-[#2d9d78] px-8 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#248263] hover:shadow-lg transition-transform transform hover:-translate-y-0.5"
              >
                Send Feedback
              </button>
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
