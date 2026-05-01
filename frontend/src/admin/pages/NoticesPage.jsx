import React, { useEffect, useState } from 'react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Admin special notices management.
export default function NoticesPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({
    title: '',
    message: '',
    priority: 'medium',
  });
  const [msg, setMsg] = useState('');
  const [openLatestUpdates, setOpenLatestUpdates] = useState(false);
  const [updatesLoading, setUpdatesLoading] = useState(false);
  const [latestUpdates, setLatestUpdates] = useState([]);

  const load = async () => {
    const d = await adminApi.getSpecialNotices({ isActive: true });
    setItems(d.data || []);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  useEffect(() => {
    if (!openLatestUpdates) return;

    let cancelled = false;

    const loadLatestUpdates = async () => {
      setUpdatesLoading(true);
      try {
        const d = await adminApi.getAuditLogs({ page: 1, limit: 10, category: 'notice' });
        if (!cancelled) setLatestUpdates(d.items || []);
      } catch {
        if (!cancelled) setLatestUpdates([]);
      } finally {
        if (!cancelled) setUpdatesLoading(false);
      }
    };

    loadLatestUpdates();

    return () => {
      cancelled = true;
    };
  }, [openLatestUpdates]);

  const add = async (e) => {
    e.preventDefault();
    setMsg('');
    const title = draft.title.trim();
    const message = draft.message.trim();

    // Validation: title length must be at least 3 characters.
    if (title.length < 3) {
      setMsg('Title must be at least 3 characters long.');
      return;
    }

    // Validation: message length must be at least 10 characters.
    if (message.length < 10) {
      setMsg('Message must be at least 10 characters long.');
      return;
    }

    try {
      await adminApi.createSpecialNotice({
        title,
        message,
        priority: draft.priority,
        type: 'info',
        createdBy: 'Admin',
      });
      setDraft({ title: '', message: '', priority: 'medium' });
      setMsg('Special notice published.');
      await load();
    } catch (error) {
      const backendMessage =
        error?.response?.data?.messages?.join(', ') ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error.message ||
        'Failed to publish notice.';
      setMsg(backendMessage);
    }
  };

  const remove = async (id) => {
    // Validation: confirm destructive action.
    if (!window.confirm('Delete this notice?')) return;
    try {
      await adminApi.deleteSpecialNotice(id);
      await load();
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message || error?.response?.data?.error || error.message || 'Failed to delete notice.';
      setMsg(backendMessage);
    }
  };

  return (
    <div className="font-admin space-y-8">
      <AdminHeader title="Special Notices" subtitle="These notices appear in the Home page Special Notices section" />

      {msg && (
        <div className="rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm px-4 py-3">
          {msg}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-admin-navy">Latest notice updates</p>
          <p className="text-xs text-slate-500">Preview the newest audit-log entries for notices.</p>
        </div>
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-admin-accent text-white text-sm font-semibold hover:opacity-90"
          onClick={() => setOpenLatestUpdates(true)}
        >
          Open latest updates
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form
          onSubmit={add}
          className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-lg font-bold text-admin-navy">Create special notice</h2>
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            rows={5}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="e.g. OPD hours extended until 3 PM on public holidays."
            value={draft.message}
            onChange={(e) => setDraft((prev) => ({ ...prev, message: e.target.value }))}
          />
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={draft.priority}
            onChange={(e) => setDraft((prev) => ({ ...prev, priority: e.target.value }))}
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-admin-purple text-white text-sm font-semibold shadow"
          >
            Publish special notice
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
                  <p className="text-sm font-bold text-slate-900 leading-relaxed">{a.title}</p>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed mt-1">{a.message}</p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    {new Date(a.createdAt).toLocaleString()}
                    <span className="ml-2 capitalize">({a.priority || 'medium'})</span>
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

      {openLatestUpdates && (
        <div
          className="fixed inset-0 z-[110] bg-slate-900/45 backdrop-blur-[2px] p-4 flex items-start justify-center"
          onClick={() => setOpenLatestUpdates(false)}
        >
          <div
            className="w-full max-w-3xl mt-14 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-admin-navy">Latest Notice Updates</h3>
                <p className="text-xs text-slate-500">Latest 10 audit log entries in the notice category.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenLatestUpdates(false)}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {updatesLoading ? (
                <p className="px-5 py-8 text-sm text-slate-500">Loading latest notice updates...</p>
              ) : latestUpdates.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-500">No notice updates found.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {latestUpdates.map((item) => (
                    <li key={item._id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{item.action || 'Notice update'}</p>
                          <p className="text-sm text-slate-600 mt-1">{item.description || 'No description'}</p>
                        </div>
                        <span className="shrink-0 inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-violet-100 text-violet-800">
                          {item.category || 'notice'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {new Date(item.createdAt).toLocaleString()} {item.actorName ? `• ${item.actorName}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setOpenLatestUpdates(false);
                  navigate('/admin/audit-logs');
                }}
              >
                View all audit logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
