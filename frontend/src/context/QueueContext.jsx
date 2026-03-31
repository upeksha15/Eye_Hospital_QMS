import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/client';

const QueueContext = createContext();

const SAMPLE_PATIENT_NAMES = [
  'Nimal Perera',
  'Kasuni Silva',
  'Amal Perera',
  'Ishara Fernando',
  'Sajith Jayasuriya',
  'Tharushi Lakmini',
];

export const QueueProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [doctorStatuses, setDoctorStatuses] = useState({});
  const [tokenNumber, setTokenNumber] = useState(1);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [recallQueue, setRecallQueue] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [timer, setTimer] = useState('00:00');
  const [toasts, setToasts] = useState([]);
  const [patientSeed, setPatientSeed] = useState(0);

  // --- Toast Logic ---
  const addToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Timer Logic ---
  useEffect(() => {
    let interval;
    if (!currentToken) {
      setTimer('00:00');
      return undefined;
    }

    if (!currentToken.startedAt) {
      const elapsed = Math.floor((currentToken.elapsed || 0) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      setTimer(`${m}:${s}`);
      return undefined;
    }

    const start = currentToken.startedAt;
    interval = setInterval(() => {
      const base = Math.floor((currentToken.elapsed || 0) / 1000);
      const delta = base + Math.floor((Date.now() - start) / 1000);
      const m = Math.floor(delta / 60).toString().padStart(2, '0');
      const s = (delta % 60).toString().padStart(2, '0');
      setTimer(`${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentToken]);

  // --- Queue Logic ---
  const formatToken = (num) => `E-${String(num).padStart(3, '0')}`;

  const enableQueue = () => {
    setIsActive(true);
    setTokenNumber(1);
    addToast("Queue Enabled! Token numbering started.", "success");
  };

  const disableQueue = () => {
    if (window.confirm("Stop the queue?")) {
      setIsActive(false);
      setCurrentToken(null);
      addToast("Queue Disabled.", "info");
    }
  };

  // Per-doctor controls (local state mirror for UI)
  const setDoctorStatus = (doctorId, status) => {
    setDoctorStatuses(prev => ({ ...prev, [doctorId]: status }));
  };

  const enableDoctor = (doctorId) => {
    if (!doctorId) return;
    setDoctorStatus(doctorId, 'Enabled');
    addToast('Queue enabled for doctor.', 'success');
  };

  const disableDoctor = (doctorId) => {
    if (!doctorId) return;
    if (!window.confirm('Stop the queue for this doctor?')) return;
    setDoctorStatus(doctorId, 'Disabled');
    addToast('Queue disabled for doctor.', 'info');
  };

  const pauseQueue = (doctorId) => {
    if (!doctorId) return;
    setCurrentToken((ct) => {
      if (!ct) return ct;
      if (ct.doctorId !== doctorId) return ct;
      const startedAt = ct.startedAt || Date.now();
      const elapsed = (ct.elapsed || 0) + (Date.now() - startedAt);
      return { ...ct, startedAt: null, elapsed };
    });
    setDoctorStatus(doctorId, 'Paused');
    addToast('Queue paused for doctor.', 'info');
  };

  const resumeQueue = (doctorId) => {
    if (!doctorId) return;
    setCurrentToken((ct) => {
      if (!ct) return ct;
      if (ct.doctorId !== doctorId) return ct;
      return { ...ct, startedAt: Date.now(), elapsed: ct.elapsed || 0 };
    });
    setDoctorStatus(doctorId, 'Enabled');
    addToast('Queue resumed for doctor.', 'success');
  };

  const simulateJoin = (doctorId) => {
    const active = doctorId ? ((doctorStatuses || {})[doctorId] === 'Enabled') : isActive;
    if (!active) return addToast("Queue not active.", "error");

    const tokenStr = formatToken(tokenNumber);
    const name = SAMPLE_PATIENT_NAMES[patientSeed % SAMPLE_PATIENT_NAMES.length];

    const newPatient = {
      id: Date.now() + Math.random(),
      number: tokenNumber,
      token: tokenStr,
      joinedAt: Date.now(),
      name,
      status: 'Waiting',
    };

    setWaitingQueue(prev => [...prev, newPatient]);
    setTokenNumber(prev => prev + 1);
    setPatientSeed(prev => prev + 1);
    addToast(`Patient ${tokenStr} joined.`, "success");
  };

  const callNext = async (doctorId) => {
    const active = doctorId ? ((doctorStatuses || {})[doctorId] === 'Enabled') : isActive;
    if (!active) {
      addToast('Cannot call next — queue is paused or disabled for this doctor.', 'error');
      return;
    }

    try {
      const res = await api.post(`/api/queue/${doctorId}/call-next`);
      if (res.data && res.data.success) {
        const next = res.data.token;
        if (next) {
          setCurrentToken({ ...next, startedAt: Date.now(), elapsed: 0 });
          addToast(`📱 SMS: Token ${next.tokenNumber} to counter.`, 'sms');
        } else {
          setCurrentToken(null);
          addToast('No patients in queue.', 'info');
        }
      } else {
        addToast('Call next failed.', 'error');
      }
    } catch (err) {
      console.error('callNext API error', err);
      addToast('Call next failed (server).', 'error');
    }
  };

  const skipToken = async (doctorId) => {
    if (!currentToken) return;
    try {
      const res = await api.post(`/api/queue/${doctorId}/skip`);
      if (res.data && res.data.success) {
        const next = res.data.next;
        setCurrentToken(next ? { ...next, startedAt: Date.now(), elapsed: 0 } : null);
        addToast(`📱 SMS: Token ${res.data.skipped?.tokenNumber || ''} skipped.`, 'sms');
      } else {
        addToast('Skip failed.', 'error');
      }
    } catch (err) {
      console.error('skip API error', err);
      addToast('Skip failed (server).', 'error');
    }
  };

  const removePatientFromQueue = async (doctorId, tokenId) => {
    try {
      const res = await api.post(`/api/queue/${doctorId}/remove/${tokenId}`);
      if (res.data && res.data.success) {
        addToast('Patient removed from queue.', 'info');
      } else {
        addToast('Remove failed.', 'error');
      }
    } catch (err) {
      console.error('remove API error', err);
      addToast('Remove failed (server).', 'error');
    }
  };

  const markPatientMissed = (id) => {
    setWaitingQueue(prev => prev.filter(p => p.id !== id));
    addToast("Patient marked as missed.", "error");
  };

  const cancelToken = (id) => {
    if (!window.confirm("Cancel this token?")) return;
    setRecallQueue(prev => prev.filter(p => p.id !== id));
    addToast("Token Cancelled.", "error");
  };

  return (
    <QueueContext.Provider value={{
      user, setUser,
      isActive, setIsActive,
      currentToken, timer,
      waitingQueue, recallQueue,
      addToast, removeToast, toasts,
      enableQueue, disableQueue,
      pauseQueue, resumeQueue, enableDoctor, disableDoctor,
      doctorStatuses,
      simulateJoin, callNext, skipToken, cancelToken,
      removePatientFromQueue, markPatientMissed
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => useContext(QueueContext);