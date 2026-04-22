const STORAGE_KEY = 'patient.notifications.v1';
const HAS_NEW_KEY = 'patient.notifications.hasNew.v1';
export const PATIENT_NOTIFICATIONS_UPDATED_EVENT = 'patient-notifications-updated';

function emitNotificationsUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PATIENT_NOTIFICATIONS_UPDATED_EVENT));
}

function readNotifications() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(items) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emitNotificationsUpdated();
}

function setHasNewNotificationFlag(value) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HAS_NEW_KEY, value ? '1' : '0');
  emitNotificationsUpdated();
}

export function getPatientNotifications() {
  return readNotifications();
}

export function hasNewPatientNotification() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(HAS_NEW_KEY) === '1';
}

export function clearNewPatientNotificationFlag() {
  setHasNewNotificationFlag(false);
}

export function markAllPatientNotificationsRead() {
  const updated = readNotifications().map((item) => ({ ...item, read: true }));
  writeNotifications(updated);
  setHasNewNotificationFlag(false);
  return updated;
}

function buildQueueControlNotification(activity, doctorName) {
  const a = String(activity || '').toLowerCase();
  if (a === 'paused') {
    return {
      title: 'Queue Paused',
      message: doctorName
        ? `Queue for ${doctorName} has been paused temporarily.`
        : 'Your queue has been paused temporarily.',
    };
  }
  if (a === 'resumed') {
    return {
      title: 'Queue Resumed',
      message: doctorName ? `Queue for ${doctorName} has resumed.` : 'Your queue has resumed.',
    };
  }
  if (a === 'stopped') {
    return {
      title: 'Queue Stopped',
      message: doctorName ? `Queue for ${doctorName} has been stopped.` : 'Your queue has been stopped.',
    };
  }
  if (a === 'enabled') {
    return {
      title: 'Queue Enabled',
      message: doctorName ? `Queue for ${doctorName} is now enabled.` : 'Your queue is now enabled.',
    };
  }
  return null;
}

export function addQueueControlNotification({ activity, doctorName }) {
  const payload = buildQueueControlNotification(activity, doctorName);
  if (!payload) return null;

  const created = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: 'queue',
    title: payload.title,
    message: payload.message,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const latest = readNotifications()[0];
  if (latest && latest.title === created.title && latest.message === created.message && !latest.read) {
    return null;
  }

  const next = [created, ...readNotifications()].slice(0, 100);
  writeNotifications(next);
  setHasNewNotificationFlag(true);
  return created;
}

export function addIncomingPatientNotification(notification) {
  if (!notification || !notification.title || !notification.message) return null;

  const created = {
    id: notification.id || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: notification.type || 'notice',
    title: String(notification.title),
    message: String(notification.message),
    createdAt: notification.createdAt || new Date().toISOString(),
    read: false,
  };

  const latest = readNotifications()[0];
  if (latest && latest.title === created.title && latest.message === created.message && !latest.read) {
    return null;
  }

  const next = [created, ...readNotifications()].slice(0, 100);
  writeNotifications(next);
  setHasNewNotificationFlag(true);
  return created;
}
