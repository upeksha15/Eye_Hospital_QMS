import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/StaffTopBar';
import SidebarNav from '../components/StaffSidebar';
import { Mail, Phone, BadgeCheck, CheckCircle, User, UploadCloud, CalendarDays } from 'lucide-react';
import { useQueue } from '../context/QueueContext';

const Profile = () => {
  const { user, setUser } = useQueue();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    staffId: '',
    email: '',
    phone: '',
    profilePic: '',
    dob: '',
    // password fields for change-password UI (frontend-only)
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!user) return;

    setFormData({
      fullName: user.name || '',
      staffId: user.staffId || String(user.id || ''),
      email: user.email || '',
      phone: user.phone || '',
      profilePic: user.profilePic || user.profilePicUrl || '',
      dob: user.dob || user.dateOfBirth || '',
    });
  }, [user]);


  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (saved) setSaved(false);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, profilePic: reader.result }));
      if (saved) setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = formData;
    if (!newPassword || newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match');
      return;
    }

    // Frontend-only: if existing user.password present, check current
    if (user && user.password && currentPassword !== user.password) {
      alert('Current password is incorrect (frontend check)');
      return;
    }

    // Update local user object only (frontend-only)
    setUser({ ...user, password: newPassword });
    setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    alert('Password updated locally (frontend-only)');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setUser({
      ...user,
      name: formData.fullName,
      staffId: formData.staffId,
      email: formData.email,
      phone: formData.phone,
      profilePic: formData.profilePic,
      dob: formData.dob,
    });
    setSaved(true);
  };

  const profileFields = [formData.fullName, formData.email, formData.phone, formData.dob, formData.profilePic];
  const filled = profileFields.filter((f) => f && String(f).trim() !== '').length;
  const profileCompletion = Math.round((filled / profileFields.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50 grid grid-rows-[82px_1fr] h-screen">
      <Navbar />

      <div className="h-full flex overflow-hidden">
        <SidebarNav />

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-10 relative">
          {saved && (
            <div className="absolute top-6 right-6 z-50">
              <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-lg border border-gray-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div className="text-sm font-medium text-slate-800">Saved</div>
              </div>
            </div>
          )}
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl text-white p-8 mb-6 shadow-2xl">
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                      <label htmlFor="photoUpload" className="block cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                          {formData.profilePic ? (
                            <img src={formData.profilePic} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            (formData.fullName || 'U').charAt(0)
                          )}
                        </div>
                      </label>
                      <input id="photoUpload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </div>
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{formData.fullName || 'Medical Staff'}</h1>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
                        <BadgeCheck className="w-4 h-4 text-white/90" /> Verified Staff
                      </span>
                      <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">
                        <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h4l3 8 4-16 3 8h4" /></svg>
                        Active Today
                      </span>
                      {formData.dob && (
                        <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm">DOB: {new Date(formData.dob).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-white/80 mb-2">Profile Completion</div>
                      <div className="w-48 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div className="h-2 bg-white/80 transition-all" style={{ width: `${profileCompletion}%` }} />
                      </div>
                      <div className="text-xs text-white/70 mt-2">{profileCompletion}% complete</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={() => navigate('/staffdashboard')} className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-sm font-semibold">Back</button>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-md border">
                {saved && (
                  <div className="mb-4 px-4 py-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-medium">
                    Profile updated successfully.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-white/50 p-6 rounded-xl shadow-inner border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">Edit Profile</h3>
                        <p className="text-xs text-slate-500">Update your personal information visible to the clinic</p>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <div className="relative">
                        <label className="block text-xs font-semibold text-slate-700 mb-2">Full Name</label>
                        <User className="absolute left-3 top-11 w-4 h-4 text-slate-400" />
                        <input type="text" className="w-full pl-11 px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition" value={formData.fullName} onChange={handleChange('fullName')} />
                      </div>

                      <div className="grid lg:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Email</label>
                          <Mail className="absolute left-3 top-11 w-4 h-4 text-slate-400" />
                          <input type="email" className="w-full pl-11 px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition" value={formData.email} onChange={handleChange('email')} />
                        </div>
                        <div className="relative">
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Phone</label>
                          <Phone className="absolute left-3 top-11 w-4 h-4 text-slate-400" />
                          <input type="tel" className="w-full pl-11 px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition" value={formData.phone} onChange={handleChange('phone')} />
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Date of Birth</label>
                          <CalendarDays className="absolute left-3 top-11 w-4 h-4 text-slate-400" />
                          <input type="date" className="w-full pl-11 px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition" value={formData.dob} onChange={handleChange('dob')} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Profile Photo</label>
                          <div className="flex items-center gap-3">
                            <label htmlFor="photoUploadInline" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 border cursor-pointer">
                              <UploadCloud className="w-4 h-4 text-slate-600" /> Upload
                            </label>
                            <input id="photoUploadInline" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            {formData.profilePic && (
                              <img src={formData.profilePic} alt="preview" className="w-12 h-12 rounded-full object-cover border" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-2">Recommended: 300x300 PNG/JPG</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 mt-2">
                        <button type="button" onClick={() => navigate('/staffdashboard')} className="px-6 py-3 rounded-xl border bg-white">Cancel</button>
                        <button type="submit" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-[1.01] transition flex items-center gap-3">
                          <CheckCircle className="w-4 h-4" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <hr className="my-6" />

                <div>
                  <h3 className="text-lg font-semibold mb-3">Change Password</h3>
                  <form onSubmit={handlePasswordSubmit} className="grid gap-3 max-w-xl">
                    <input type="password" placeholder="Current password" value={formData.currentPassword} onChange={handleChange('currentPassword')} className="px-4 py-3 border rounded-xl bg-slate-50" />
                    <input type="password" placeholder="New password" value={formData.newPassword} onChange={handleChange('newPassword')} className="px-4 py-3 border rounded-xl bg-slate-50" />
                    <input type="password" placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} className="px-4 py-3 border rounded-xl bg-slate-50" />
                    <div className="flex justify-end">
                      <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold">Change Password</button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-md border">
                  <h3 className="text-sm font-semibold text-slate-500">Contact</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="text-sm font-medium text-slate-800">Email</div>
                        <div className="text-xs text-slate-500">{formData.email || 'Not set'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="text-sm font-medium text-slate-800">Phone</div>
                        <div className="text-xs text-slate-500">{formData.phone || 'Not set'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <div>
                        <div className="text-sm font-medium text-slate-800">Date of Birth</div>
                        <div className="text-xs text-slate-500">{formData.dob ? new Date(formData.dob).toLocaleDateString() : 'Not set'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions removed per request */}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;

