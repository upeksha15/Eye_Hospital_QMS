import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  User,
  BriefcaseBusiness,
  Phone,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react';
import AdminHeader from '../AdminHeader';
import { useAuth } from '../../context/AuthContext';
import * as authApi from '../../api/authApi';

// Admin self-service profile view (edit + delete account).
export default function AdminProfilePage() {
  const navigate = useNavigate();
  const { user, updateStaff, logout } = useAuth();
  const [isEditing, setIsEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
  });

  React.useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      contactNumber: user?.contactNumber || '',
    });
  }, [user]);

  const initials = (user?.fullName || 'Admin')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        contactNumber: form.contactNumber.trim(),
      };
      const data = await authApi.updateStaffData(payload);
      const updated = data.user || data.staff;
      if (updated) updateStaff(updated);
      setIsEditing(false);
      setMessage('Profile updated successfully.');
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    // Validation: require DELETE confirmation text.
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Type DELETE to confirm account removal.');
      return;
    }

    setDeleting(true);
    setError('');
    setMessage('');
    try {
      await authApi.deleteMyAccount();
      logout();
      navigate('/login', { replace: true });
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  return (
    <div className="font-admin">
      <AdminHeader
        title="Admin Profile"
        subtitle="View your account details and role information"
      />

      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-5 border-b border-slate-200 pb-6 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-admin-navy truncate">{user?.fullName || 'Admin User'}</h2>
            <p className="text-slate-500 mt-1">{user?.email || 'No email available'}</p>
            <span className="inline-flex mt-3 items-center gap-2 rounded-full bg-blue-50 text-admin-accent border border-blue-100 px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              System Administrator
            </span>
          </div>

          <div className="md:ml-auto flex flex-wrap items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMessage('');
                  setIsEditing(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#007bff] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      fullName: user?.fullName || '',
                      email: user?.email || '',
                      contactNumber: user?.contactNumber || '',
                    });
                    setIsEditing(false);
                    setError('');
                    setMessage('');
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                setError('');
                setMessage('');
                setShowDeleteConfirm((prev) => !prev);
                setDeleteConfirmText('');
              }}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-60"
            >
              <Trash2 className="w-4 h-4" />
              {showDeleteConfirm ? 'Close Delete' : 'Delete'}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {showDeleteConfirm && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50/70 p-4">
            <p className="text-sm text-red-800 font-semibold">Permanent account deletion</p>
            <p className="text-xs text-red-700 mt-1">
              This will permanently remove your account. Type DELETE below to confirm.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="flex-1 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-red-200"
              />
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Full Name</p>
            {isEditing ? (
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                <User className="w-4 h-4 text-admin-accent" />
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none text-slate-800"
                  placeholder="Enter full name"
                />
              </label>
            ) : (
              <p className="flex items-center gap-2 text-slate-800 font-medium">
                <User className="w-4 h-4 text-admin-accent" />
                {user?.fullName || 'N/A'}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Email</p>
            {isEditing ? (
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                <Mail className="w-4 h-4 text-admin-accent" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none text-slate-800"
                  placeholder="Enter email"
                />
              </label>
            ) : (
              <p className="flex items-center gap-2 text-slate-800 font-medium break-all">
                <Mail className="w-4 h-4 text-admin-accent" />
                {user?.email || 'N/A'}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Contact Number</p>
            {isEditing ? (
              <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                <Phone className="w-4 h-4 text-admin-accent" />
                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className="w-full bg-transparent outline-none text-slate-800"
                  placeholder="Enter contact number"
                />
              </label>
            ) : (
              <p className="flex items-center gap-2 text-slate-800 font-medium">
                <Phone className="w-4 h-4 text-admin-accent" />
                {user?.contactNumber || 'N/A'}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Role</p>
            <p className="flex items-center gap-2 text-slate-800 font-medium capitalize">
              <BriefcaseBusiness className="w-4 h-4 text-admin-accent" />
              {user?.role || 'admin'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Account Type</p>
            <p className="text-slate-800 font-medium capitalize">{user?.userType || 'staff'}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
