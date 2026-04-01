import React, { createContext, useCallback, useEffect, useContext, useState } from 'react';
import api from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { fetchQueueBoardToday } from '../api/queueApi';

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

  const cancelToken = (id) => {
    if (!window.confirm("Cancel this token?")) return;
    setRecallQueue(prev => prev.filter(p => p.id !== id));
    addToast("Token Cancelled.", "error");
  };

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
      removePatientFromQueue, markPatientMissed
      ,activeDoctorId, setActiveDoctorId
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => useContext(QueueContext);