import React, { useEffect, useState } from 'react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';
import { Trash2, UserPlus } from 'lucide-react';

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'medical_staff',
};

export default function StaffAccountsPage() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const d = await adminApi.getStaffAccounts();
    setList(d.staff || []);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      if (editingId) {
        const body = { fullName: form.fullName, email: form.email, role: form.role, isActive: true };
        if (form.password) body.password = form.password;
        await adminApi.updateStaffAccount(editingId, body);
        setEditingId(null);
        setForm(emptyForm);
        setMsg('Account updated.');
      } else {
        await adminApi.createStaffAccount({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setForm(emptyForm);
        setMsg('Staff login created. Share credentials securely.');
      }
      await load();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  const edit = (row) => {
    setEditingId(row._id);
    setForm({
      fullName: row.fullName,
      email: row.email,
      password: '',
      role: row.role,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deactivate = async (id) => {
    if (!window.confirm('Deactivate this account? They will no longer be able to sign in.')) return;
    setMsg('');
    try {
      await adminApi.deleteStaffAccount(id);
      await load();
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
    } catch (err) {
      setMsg(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="font-admin space-y-8">
      <AdminHeader
        title="Staff accounts"
        subtitle="Create and manage admin and medical staff logins (not patient accounts)"
      />

      {msg && (
        <div className="rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm px-4 py-3">
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form
          onSubmit={submit}
          className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-admin-navy flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-admin-accent" />
            {editingId ? 'Edit staff account' : 'New staff login'}
          </h2>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Full name</span>
            <input
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Work email (login)</span>
            <input
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">
              {editingId ? 'New password (leave blank to keep)' : 'Initial password'}
            </span>
            <input
              type="password"
              required={!editingId}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Role</span>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="medical_staff">Medical staff</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-admin-accent text-white text-sm font-semibold shadow"
            >
              {editingId ? 'Save changes' : 'Create account'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-admin-navy">Active directory</h2>
            <p className="text-sm text-slate-500 mt-1">
              Staff must choose the matching role on the login screen (Admin vs Medical staff).
            </p>
          </div>
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-xs text-slate-500 uppercase">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-3 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s._id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium">{s.fullName}</td>
                    <td className="px-3 py-3 text-slate-600">{s.email}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-lg bg-slate-100 text-xs font-semibold capitalize">
                        {s.role === 'medical_staff' ? 'Medical staff' : 'Admin'}
                      </span>
                      {!s.isActive && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="text-xs font-semibold text-admin-accent hover:underline"
                          onClick={() => edit(s)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="p-2 rounded-lg hover:bg-red-50"
                          onClick={() => deactivate(s._id)}
                          title="Deactivate"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
