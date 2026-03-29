import React, { useEffect, useState } from 'react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const d = await adminApi.getPatients();
    setUsers(d.users || []);
  };

  useEffect(() => {
    load().catch((e) => setError(e.message || 'Failed to load'));
  }, []);

  return (
    <div className="font-admin space-y-8">
      <AdminHeader
        title="Patient directory"
        subtitle="Self-registered patients (separate from staff accounts created under Staff accounts)"
      />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{error}</div>
      )}

      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-admin-navy">Registered patients</h2>
          <p className="text-sm text-slate-500 mt-1">
            These accounts are created via public registration. Staff and admin logins are managed separately.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-5 py-3">Name</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">NIC</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Registered</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-semibold text-slate-800">{u.fullName}</td>
                  <td className="px-3 py-3 text-slate-600">{u.email || '—'}</td>
                  <td className="px-3 py-3 text-slate-600 font-mono text-xs">{u.nic}</td>
                  <td className="px-3 py-3 text-slate-600">{u.contactNumber || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
