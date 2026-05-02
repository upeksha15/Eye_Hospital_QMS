import React, { createContext, useCallback, useEffect, useContext, useState } from 'react';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { fetchQueueBoardToday, fetchSkippedToday } from '../api/queueApi';

const QueueContext = createContext();

export const QueueProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Staff screens operate on one active doctor at a time.
  const [activeDoctorId, setActiveDoctorId] = useState('');

  const [doctorStatuses, setDoctorStatuses] = useState({});
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [recallQueue, setRecallQueue] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);
  const [timer, setTimer] = useState('00:00');
  const [toasts, setToasts] = useState([]);

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

  const setDoctorStatus = useCallback((doctorId, status) => {
    setDoctorStatuses((prev) => ({ ...prev, [doctorId]: status }));
  }, []);

  const syncFromBoard = useCallback((board) => {
    const tokens = board?.tokens || [];
    const called = tokens.find((t) => t.status === 'called') || null;
    const waiting = tokens.filter((t) => t.status === 'waiting');

    setWaitingQueue(
      waiting.map((t) => ({
        _id: t._id,
        token: t.tokenNumber,
        name: t.patientName,
        status: 'Waiting',
      }))
    );

    setCurrentToken(
      called
        ? {
            _id: called._id,
            token: called.tokenNumber,
            name: called.patientName,
            startedAt: Date.now(),
            elapsed: 0,
            doctorId: activeDoctorId,
          }
        : null
    );

    if (activeDoctorId && board?.status) {
      setDoctorStatus(activeDoctorId, board.status);
    }
  }, [activeDoctorId, setDoctorStatus]);

  const reloadBoard = useCallback(async () => {
    if (!activeDoctorId) return;
    try {
      const board = await fetchQueueBoardToday(activeDoctorId);
      syncFromBoard(board);
      // fetch skipped tokens persisted in backend and populate recallQueue
      try {
        const skippedRes = await fetchSkippedToday(activeDoctorId);
        if (skippedRes && skippedRes.skipped) {
          const items = skippedRes.skipped.map((s) => ({
            id: String(s._id),
            token: s.tokenNumber || '',
            skippedAt: s.skippedAt ? new Date(s.skippedAt).getTime() : Date.now(),
            doctorId: activeDoctorId,
            patientName: s.patient?.fullName || '',
            patientPhone: s.patient?.contactNumber || '',
          }));
          setRecallQueue(items);
        }
      } catch (err) {
        console.error('Failed to load skipped tokens', err);
      }
    } catch (e) {
      // do not toast on every poll/update failure
      console.error('Failed to reload queue board', e);
    }
  }, [activeDoctorId, syncFromBoard]);

  useEffect(() => {
    reloadBoard();
  }, [reloadBoard]);

  useSocket(activeDoctorId, reloadBoard, null);

  const callNext = async (doctorId) => {
    try {
      const res = await api.post(`/api/queue/${doctorId}/call-next`);
      if (res.data && res.data.success) {
        await reloadBoard();
        addToast('Called next patient.', 'success');
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
        // If backend returned the skipped token, add it to the recallQueue so UI shows it
        const skipped = res.data.skipped;
        if (skipped) {
          try {
            const entryDoctor = doctorId || (skipped.doctorId && (skipped.doctorId._id || skipped.doctorId)) || null;
            const patient = skipped.patient || null;
            const entry = {
              id: String(skipped._id || skipped.id),
              token: skipped.tokenNumber || skipped.token || '',
              skippedAt: Date.now(),
              doctorId: entryDoctor,
              patientName: patient?.fullName || '',
              patientPhone: patient?.contactNumber || '',
            };
            setRecallQueue((prev) => [entry, ...prev]);
          } catch (e) {
            // ignore mapping errors
          }
        }
        await reloadBoard();
        addToast('Skipped current patient.', 'info');
      } else {
        addToast('Skip failed.', 'error');
      }
    } catch (err) {
      console.error('skip API error', err);
      addToast('Skip failed (server).', 'error');
    }
  };

  // NOTE: recall entries are persisted by backend; we'll auto-remove them at 5:00 PM local time (end of day)

  const removePatientFromQueue = async (doctorId, tokenId) => {
    try {
      const res = await api.post(`/api/queue/${doctorId}/remove/${tokenId}`);
      if (res.data && res.data.success) {
        addToast('Patient removed from queue.', 'info');
        await reloadBoard();
      } else {
        addToast('Remove failed.', 'error');
      }
    } catch (err) {
      console.error('remove API error', err);
      addToast('Remove failed (server).', 'error');
    }
  };

  const markPatientMissed = (id) => {
    setWaitingQueue(prev => prev.filter(p => String(p._id || p.id) !== String(id)));
    addToast("Patient marked as missed.", "error");
  };

  const cancelToken = async (id) => {
    if (!window.confirm("Cancel this token?")) return;
    const entry = recallQueue.find((p) => String(p.id) === String(id));
    const doctorForEntry = entry?.doctorId || activeDoctorId || '';
    try {
      await removePatientFromQueue(doctorForEntry, id);
      setRecallQueue((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (e) {
      // fallback to local removal if API call fails
      setRecallQueue((prev) => prev.filter((p) => String(p.id) !== String(id)));
    }
  };

  const markSkippedDone = async (id) => {
    if (!window.confirm('Mark this skipped patient as done?')) return;
    const entry = recallQueue.find((p) => String(p.id) === String(id));
    const doctorForEntry = entry?.doctorId || activeDoctorId || '';
    try {
      const res = await api.post(`/api/queue/${doctorForEntry}/mark-done/${id}`);
      if (res.data && res.data.success) {
        addToast('Marked skipped patient as done.', 'success');
        setRecallQueue((prev) => prev.filter((p) => String(p.id) !== String(id)));
        await reloadBoard();
      } else {
        addToast('Mark as done failed.', 'error');
      }
    } catch (err) {
      console.error('markSkippedDone API error', err);
      addToast('Mark as done failed (server).', 'error');
    }
  };

  // Auto-remove all recall entries at 5:00 PM local time (calls removal API for each)
  useEffect(() => {
    let timeoutId = null;

    const schedule = () => {
      const now = Date.now();
      const end = new Date();
      end.setHours(17, 0, 0, 0);
      const endMs = end.getTime();

      if (now >= endMs) {
        // already past 5pm: remove immediately
        recallQueue.forEach((p) => {
          const did = p?.doctorId || activeDoctorId || '';
          if (p?.id) removePatientFromQueue(did, p.id);
        });
        setRecallQueue([]);
        return;
      }

      const ms = endMs - now + 1000;
      timeoutId = setTimeout(() => {
        recallQueue.forEach((p) => {
          const did = p?.doctorId || activeDoctorId || '';
          if (p?.id) removePatientFromQueue(did, p.id);
        });
        setRecallQueue([]);
      }, ms);
    };

    schedule();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [recallQueue, activeDoctorId, removePatientFromQueue]);

  const enableDoctor = async (doctorId) => {
    if (!doctorId) return;
    setDoctorStatus(doctorId, 'Enabled');
    try {
      await api.post(`/api/doctor-rooms/${doctorId}/enable`);
      await reloadBoard();
    } catch (e) {
      console.error('Enable doctor room failed', e);
    }
  };

  const disableDoctor = async (doctorId) => {
    if (!doctorId) return;
    if (!window.confirm('Stop the queue for this doctor?')) return;
    setDoctorStatus(doctorId, 'Disabled');
    try {
      await api.post(`/api/doctor-rooms/${doctorId}/disable`);
      await reloadBoard();
    } catch (e) {
      console.error('Disable doctor room failed', e);
    }
  };

  const pauseQueue = async (doctorId) => {
    if (!doctorId) return;
    setDoctorStatus(doctorId, 'Paused');
    try {
      await api.post(`/api/doctor-rooms/${doctorId}/pause`);
      await reloadBoard();
    } catch (e) {
      console.error('Pause doctor room failed', e);
    }
  };

  const resumeQueue = async (doctorId) => {
    if (!doctorId) return;
    setDoctorStatus(doctorId, 'Enabled');
    try {
      await api.post(`/api/doctor-rooms/${doctorId}/resume`);
      await reloadBoard();
    } catch (e) {
      console.error('Resume doctor room failed', e);
    }
  };

  return (
    <QueueContext.Provider value={{
      user, setUser,
      currentToken, timer,
      waitingQueue, recallQueue,
      addToast, removeToast, toasts,
      pauseQueue, resumeQueue, enableDoctor, disableDoctor,
      doctorStatuses,
      callNext, skipToken, cancelToken,
      markSkippedDone,
      removePatientFromQueue, markPatientMissed
      ,activeDoctorId, setActiveDoctorId
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => useContext(QueueContext);