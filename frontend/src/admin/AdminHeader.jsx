import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Clock } from 'lucide-react';
import * as adminApi from '../api/adminApi';

export default function AdminHeader({ title, subtitle }) {
  const [now, setNow] = useState(new Date());
  const [unread, setUnread] = useState(3);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    adminApi.getNotifications().then((d) => setUnread(d.unread ?? 3)).catch(() => {});
  }, []);

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
        >
          <Bell className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        </button>
      </div>
    </header>
  );
}
