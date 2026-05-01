import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as adminApi from '../api/adminApi';

// Admin header with clock, date, and audit-log notifications.
const AUDIT_LOG_LAST_SEEN_KEY = 'admin_audit_log_last_seen_at';

function readLastSeenAuditLogTime() {
  if (typeof window === 'undefined') return 0;
  const raw = window.localStorage.getItem(AUDIT_LOG_LAST_SEEN_KEY);
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeLastSeenAuditLogTime(value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AUDIT_LOG_LAST_SEEN_KEY, String(value));
}

export default function AdminHeader({ title, subtitle }) {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [hasUnreadAuditLogs, setHasUnreadAuditLogs] = useState(false);
  const [openAuditPanel, setOpenAuditPanel] = useState(false);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [latestAuditLogs, setLatestAuditLogs] = useState([]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshAuditBadge = async () => {
      try {
        const d = await adminApi.getAuditLogs({ page: 1, limit: 10 });
        const items = d.items || [];
        const newestAt = items[0]?.createdAt ? new Date(items[0].createdAt).getTime() : 0;
        const lastSeenAt = readLastSeenAuditLogTime();

        if (!cancelled) {
          setHasUnreadAuditLogs(newestAt > lastSeenAt && items.length > 0);
        }
      } catch {
        if (!cancelled) setHasUnreadAuditLogs(false);
      }
    };

    refreshAuditBadge();
    const interval = setInterval(refreshAuditBadge, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!openAuditPanel) return;

    let cancelled = false;

    const loadLatestAuditLogs = async () => {
      setNoticeLoading(true);
      try {
        const d = await adminApi.getAuditLogs({ page: 1, limit: 10 });
        const items = d.items || [];
        if (!cancelled) setLatestAuditLogs(items);
      } catch {
        if (!cancelled) setLatestAuditLogs([]);
      } finally {
        if (!cancelled) setNoticeLoading(false);
      }
    };

    loadLatestAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [openAuditPanel]);

  const openAuditNotifications = () => {
    writeLastSeenAuditLogTime(Date.now());
    setHasUnreadAuditLogs(false);
    setOpenAuditPanel(true);
  };

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 font-admin">
      <div>
        <h1 className="text-2xl font-bold text-admin-navy tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/80 shadow-sm text-sm text-slate-700">
          <Calendar className="w-4 h-4 text-admin-accent" />
          <span className="hidden md:inline">{dateStr}</span>
          <span className="md:hidden">{now.toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/80 shadow-sm text-sm text-slate-700 tabular-nums">
          <Clock className="w-4 h-4 text-emerald-600" />
          {timeStr}
        </div>
        <button
          type="button"
          className="relative p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-sm text-slate-600 hover:text-admin-accent transition-colors"
          aria-label="Notifications"
          onClick={openAuditNotifications}
        >
          <Bell className="w-5 h-5" />
          {hasUnreadAuditLogs && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </button>
      </div>

      {openAuditPanel && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-[2px] p-4 flex items-start justify-center"
          onClick={() => setOpenAuditPanel(false)}
        >
          <div
            className="w-full max-w-2xl mt-14 rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-admin-navy">Latest Updates</h3>
              <button
                type="button"
                onClick={() => setOpenAuditPanel(false)}
                className="text-slate-500 hover:text-slate-700 text-sm font-medium"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {noticeLoading ? (
                <p className="px-5 py-8 text-sm text-slate-500">Loading latest updates...</p>
              ) : latestAuditLogs.length === 0 ? (
                <p className="px-5 py-8 text-sm text-slate-500">No audit updates found.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {latestAuditLogs.map((item) => (
                    <li key={item._id} className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-800">{item.action || 'Update'}</p>
                      <p className="text-sm text-slate-600 mt-1">{item.description || 'No description'}</p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {new Date(item.createdAt).toLocaleString()} {item.actorName ? `• ${item.actorName}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-admin-accent text-white text-sm font-semibold hover:opacity-90"
                onClick={() => {
                  setOpenAuditPanel(false);
                  navigate('/admin/audit-logs');
                }}
              >
                See All Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
