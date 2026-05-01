import React, { useEffect, useState } from 'react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';

// Admin system settings editor.
export default function AdminSettingsPage() {
  const [form, setForm] = useState({
    hospitalName: '',
    timezone: 'Asia/Colombo',
    defaultSlotMinutes: 15,
    maxAdvanceBookingDays: 60,
    maintenanceMode: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    adminApi
      .getSettings()
      .then((d) => {
        if (d.settings) setForm((f) => ({ ...f, ...d.settings }));
      })
      .catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaved(false);
    await adminApi.patchSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="font-admin space-y-8">
      <AdminHeader title="Settings" subtitle="Global defaults for slots, branding, and maintenance" />

      <form
        onSubmit={submit}
        className="max-w-2xl rounded-2xl bg-white border border-slate-200/80 shadow-sm p-8 space-y-5"
      >
        <label className="block">
          <span className="text-xs font-semibold text-slate-500">Hospital display name</span>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.hospitalName}
            onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-500">Timezone</span>
          <input
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono bg-slate-50 text-slate-500 cursor-not-allowed"
            value={form.timezone}
            readOnly
            aria-readonly="true"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Default slot length (minutes)</span>
            {/* Validation: enforce minimum slot length via input min. */}
            <input
              type="number"
              min={5}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.defaultSlotMinutes}
              onChange={(e) => setForm({ ...form, defaultSlotMinutes: Number(e.target.value) })}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Max advance booking (days)</span>
            {/* Validation: enforce minimum booking window via input min. */}
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              value={form.maxAdvanceBookingDays}
              onChange={(e) => setForm({ ...form, maxAdvanceBookingDays: Number(e.target.value) })}
            />
          </label>
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-slate-300 w-4 h-4 text-admin-accent"
            checked={!!form.maintenanceMode}
            onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
          />
          <span className="text-sm font-medium text-slate-700">Maintenance mode (read-only for patients)</span>
        </label>
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-admin-navy text-white text-sm font-semibold shadow-lg hover:opacity-95"
        >
          Save settings
        </button>
        {saved && <p className="text-sm text-emerald-600 font-medium">Settings saved.</p>}
      </form>
    </div>
  );
}
