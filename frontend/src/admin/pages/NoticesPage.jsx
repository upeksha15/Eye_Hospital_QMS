import React, { useEffect, useState } from 'react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';
import { Trash2 } from 'lucide-react';

export default function NoticesPage() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState('');

  const load = async () => {
    const d = await adminApi.getAnnouncementsAdmin();
    setItems(d.announcements || []);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    await adminApi.createAnnouncement({ message: draft, isActive: true });
    setDraft('');
    await load();
  };

  const toggle = async (id, isActive) => {
    await adminApi.updateAnnouncement(id, { isActive: !isActive });
    await load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    await adminApi.deleteAnnouncement(id);
    await load();
  };

  return (
    <div className="font-admin space-y-8">
      <AdminHeader title="Notices & Announcements" subtitle="Broadcast updates across OPD kiosks and booking pages" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form
          onSubmit={add}
          className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-admin-navy">Create notice</h2>
          <textarea
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g. OPD hours extended until 3 PM on public holidays."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-admin-purple text-white text-sm font-semibold shadow"
          >
            Publish announcement
          </button>
        </form>

        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-lg font-bold text-admin-navy mb-4">Live board</h2>
          <ul className="space-y-3 max-h-[420px] overflow-y-auto">
            {items.map((a) => (
              <li
                key={a._id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 flex gap-3 items-start"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{a.message}</p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {new Date(a.createdAt).toLocaleString()} ·{' '}
                    <button
                      type="button"
                      className="text-admin-accent font-semibold"
                      onClick={() => toggle(a._id, a.isActive)}
                    >
                      {a.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </p>
                </div>
                <button type="button" className="p-2 rounded-lg hover:bg-red-50" onClick={() => remove(a._id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-sm text-slate-400 italic">No announcements yet.</li>
            )}
          </ul>
        </div>
      </div>

    </div>
  );
}
