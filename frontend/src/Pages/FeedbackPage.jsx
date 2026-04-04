import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, Bell } from 'lucide-react';
import { fetchFeedback } from '../api/feedbackApi';

const FeedbackPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-[#f0f7ff] font-sans text-slate-800 w-full">
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
          <Link to="/contact" className="hover:text-blue-700">Contact</Link>
          <span className="border-b-2 border-blue-600">Feedback</span>
          <Bell className="w-6 h-6 text-slate-600" />
        </div>
      </nav>

      {/* Content */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-[#003366]">Feedback</h1>
            <p className="mt-4 text-slate-700 max-w-2xl mx-auto">
              See feedback and ratings shared by patients about the Queue Management System and clinics.
            </p>
          </div>

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
    </div>
  );
};

export default FeedbackPage;
