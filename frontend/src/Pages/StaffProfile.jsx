import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/StaffTopBar';
import SidebarNav from '../components/StaffSidebar';
import { Mail, Phone, BadgeCheck, CheckCircle, User, UploadCloud, CalendarDays, Eye, EyeOff } from 'lucide-react';
import { nowColombo } from '../utils/dateHelpers';
import { useQueue } from '../context/QueueContext';
import { useAuth } from '../hooks/useAuth';
import { updateStaffData, fetchMe } from '../api/authApi';
import { changePasswordStaff } from '../api/staffApi';

const Profile = () => {
  const { user, setUser } = useQueue();
  const { logout } = useAuth();
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

  const [showPassword, setShowPassword] = useState(false);
  const [pwErrors, setPwErrors] = useState({ current: '', new: '', confirm: '', general: '' });
  const [profileErrors, setProfileErrors] = useState({ phone: '' });

  useEffect(() => {
    if (!user) return;

    setFormData({
      fullName: user.fullName || user.name || '',
      staffId: user.staffId || String(user.id || ''),
      email: user.email || '',
      phone: user.contactNumber || user.phone || '',
      profilePic: user.profileImage || user.profilePic || user.profilePicUrl || '',
      dob: user.dateOfBirth ? (new Date(user.dateOfBirth)).toISOString().slice(0,10) : (user.dob || ''),
    });
  }, [user]);

  // Fetch fresh staff info when the page loads and populate the form
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchMe();
        const u = res.user || res.staff || res.patient || null;
        if (!u) return;
        const normalized = { ...u, userType: res.userType || u.userType || 'staff' };
        if (mounted) setUser(normalized);
      } catch (err) {
        // ignore — user may not be authenticated
        console.debug('fetchMe failed', err?.message || err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [setUser]);

  const maxDob = nowColombo().toISOString().slice(0, 10);


  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (saved) setSaved(false);
    // clear inline errors for password fields
    if (field === 'currentPassword' || field === 'newPassword' || field === 'confirmPassword') {
      const key = field === 'confirmPassword' ? 'confirm' : field === 'newPassword' ? 'new' : 'current';
      setPwErrors((prev) => ({ ...prev, [key]: '', general: '' }));
    }
    // inline phone validation
    if (field === 'phone') {
      // Accept formats: local 0XXXXXXXXX (10 digits) or international +94XXXXXXXXX (9 digits after +94)
      const ok = val === '' || /^(?:\+94|0)?\d{9}$/.test(val);
      setProfileErrors((prev) => ({ ...prev, phone: ok ? '' : 'Enter a valid phone number (e.g. 0771234567 or +94771234567)' }));
    }
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = formData;
    // client-side validation with inline errors
    const nextErrors = { current: '', new: '', confirm: '', general: '' };
    let hasError = false;
    if (!currentPassword || currentPassword.trim() === '') {
      nextErrors.current = 'Enter current password';
      hasError = true;
    }
    if (!newPassword || newPassword.length < 6) {
      nextErrors.new = 'New password must be at least 6 characters';
      hasError = true;
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirm = 'New password and confirmation do not match';
      hasError = true;
    }
    if (hasError) {
      setPwErrors(nextErrors);
      return;
    }

    try {
      const res = await changePasswordStaff({ currentPassword, newPassword });
      if (res && res.success) {
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        // clear any previous errors
        setPwErrors({ current: '', new: '', confirm: '', general: '' });
        // logout user to invalidate session locally
        try {
          setUser(null);
        } catch (e) {}
        try {
          logout();
        } catch (e) {}
        alert('Password updated — you have been logged out. Please log in again.');
        navigate('/');
      } else {
        // try to map server-side field errors to inline fields
        const msg = res?.message || res?.error || 'Failed to change password';
        const errors = res?.errors || res?.data?.errors || null;
        if (errors && typeof errors === 'object') {
          setPwErrors((prev) => ({
            current: errors.currentPassword || errors.current || '',
            new: errors.newPassword || errors.new || '',
            confirm: errors.confirmPassword || errors.confirm || '',
            general: msg || '',
          }));
        } else {
          setPwErrors((prev) => ({ ...prev, general: msg }));
        }
      }
    } catch (err) {
      console.error('changePassword error', err);
      const data = err?.response?.data || {};
      const msg = data?.message || data?.error || 'Failed to change password';
      const errors = data?.errors || null;
      if (errors && typeof errors === 'object') {
        setPwErrors({
          current: errors.currentPassword || errors.current || '',
          new: errors.newPassword || errors.new || '',
          confirm: errors.confirmPassword || errors.confirm || '',
          general: msg || '',
        });
      } else {
        setPwErrors((prev) => ({ ...prev, general: msg }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // final profile validation
    if (profileErrors.phone) {
      alert('Please fix validation errors before saving');
      return;
    }
    // validate phone one more time
    if (formData.phone && !/^(?:\+94|0)?\d{9}$/.test(formData.phone)) {
      setProfileErrors((prev) => ({ ...prev, phone: 'Enter a valid phone number (e.g. 0771234567 or +94771234567)' }));
      alert('Please fix validation errors before saving');
      return;
    }

    try {
      const body = {
        fullName: formData.fullName,
        email: formData.email,
        contactNumber: formData.phone,
        dateOfBirth: formData.dob || null,
        profileImage: formData.profilePic || null,
        staffId: formData.staffId,
      };
      const res = await updateStaffData(body);
      const returned = res.user || res.staff || (res.data && (res.data.user || res.data.staff)) || null;
      if (returned) {
        setUser(returned);
      } else {
        setUser({ ...user, fullName: formData.fullName, email: formData.email });
      }
      setSaved(true);
    } catch (err) {
      console.error('Failed to update staff profile', err);
      alert(err?.response?.data?.message || 'Failed to save profile');
    }
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
                            {profileErrors.phone && <div className="text-xs text-red-600 mt-1">{profileErrors.phone}</div>}
                        </div>
                      </div>

                      <div className="grid lg:grid-cols-2 gap-4">
                        <div className="relative">
                          <label className="block text-xs font-semibold text-slate-700 mb-2">Date of Birth</label>
                          <CalendarDays className="absolute left-3 top-11 w-4 h-4 text-slate-400" />
                          <input type="date" max={maxDob} className="w-full pl-11 px-4 py-3 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 transition" value={formData.dob} onChange={handleChange('dob')} />
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
                  <form onSubmit={handlePasswordSubmit} className="grid gap-3 max-w-xl relative">
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} placeholder="Current password" value={formData.currentPassword} onChange={handleChange('currentPassword')} className="w-full px-4 py-3 border rounded-xl bg-slate-50 pr-10" />
                      <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {pwErrors.current && <div className="text-sm text-red-600 mt-1">{pwErrors.current}</div>}
                    </div>

                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} placeholder="New password" value={formData.newPassword} onChange={handleChange('newPassword')} className="w-full px-4 py-3 border rounded-xl bg-slate-50 pr-10" />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </div>
                      {pwErrors.new && <div className="text-sm text-red-600 mt-1">{pwErrors.new}</div>}
                    </div>

                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} placeholder="Confirm new password" value={formData.confirmPassword} onChange={handleChange('confirmPassword')} className="w-full px-4 py-3 border rounded-xl bg-slate-50 pr-10" />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </div>
                      {pwErrors.confirm && <div className="text-sm text-red-600 mt-1">{pwErrors.confirm}</div>}
                    </div>

                    {pwErrors.general && <div className="text-sm text-red-600">{pwErrors.general}</div>}

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

