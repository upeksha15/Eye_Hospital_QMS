import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, Activity, AlertCircle } from 'lucide-react';
import {
  getPatientNotifications,
  markAllPatientNotificationsRead,
  PATIENT_NOTIFICATIONS_UPDATED_EVENT,
} from '../utils/patientNotifications';

function getIcon(type) {
  switch (type) {
    case 'appointment':
      return <Calendar size={18} className="text-[#2563EB]" />;
    case 'queue':
      return <Activity size={18} className="text-[#0D9488]" />;
    default:
      return <AlertCircle size={18} className="text-[#EA580C]" />;
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const refresh = () => {
      setItems(getPatientNotifications());
    };

    refresh();
    window.addEventListener(PATIENT_NOTIFICATIONS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(PATIENT_NOTIFICATIONS_UPDATED_EVENT, refresh);
    };
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const decorated = useMemo(
    () =>
      items.map((n) => ({
        ...n,
        time: n.createdAt
          ? new Date(n.createdAt).toLocaleString([], {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Just now',
      })),
    [items]
  );

  const handleMarkAllRead = () => {
    setItems(markAllPatientNotificationsRead());
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F4C81] flex items-center gap-2">
            <Bell size={22} className="text-[#2563EB]" />
            Notifications
          </h1>
          <p className="text-sm text-slate-600">
            View updates about your appointments, queue, and notices.
          </p>
          {unreadCount > 0 && (
            <p className="mt-1 text-xs font-medium text-[#2563EB]">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]"
          >
            Mark all as read
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <Bell size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">You have no notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decorated.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-3 rounded-xl border p-4 bg-white ${
                !notification.read ? 'border-[#2563EB]/40 bg-[#EFF6FF]' : 'border-slate-200'
              }`}
            >
              <div className="mt-1">{getIcon(notification.type)}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[#0F4C81]">{notification.title}</h3>
                  <span className="text-xs text-slate-500">{notification.time}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                {!notification.read && (
                  <span className="mt-2 inline-flex rounded-full bg-[#2563EB] px-2.5 py-0.5 text-[11px] font-medium text-white">
                    New
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
