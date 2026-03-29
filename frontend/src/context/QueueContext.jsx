import React, { createContext, useState, useEffect, useContext } from 'react';

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
    if (currentToken) {
      const start = Date.now();
      interval = setInterval(() => {
        const delta = Math.floor((Date.now() - start) / 1000);
        const m = Math.floor(delta / 60).toString().padStart(2, '0');
        const s = (delta % 60).toString().padStart(2, '0');
        setTimer(`${m}:${s}`);
      }, 1000);
    } else {
      setTimer('00:00');
    }
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

  const simulateJoin = () => {
    if (!isActive) return addToast("Queue not active.", "error");

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

  const callNext = () => {
    if (currentToken) {
      // Finish current logic implicit by setting to null
      setCurrentToken(null);
      return;
    }

    let nextPatient = null;
    const now = Date.now();

    // 1. Priority: Recall Queue (Valid only)
    const validRecalls = recallQueue.filter(p => (now - p.skippedAt) <= 10 * 60 * 1000);
    
    if (validRecalls.length > 0) {
      nextPatient = validRecalls[0];
      setRecallQueue(prev => prev.filter(p => p.id !== nextPatient.id));
      nextPatient.recallCount = (nextPatient.recallCount || 0) + 1;
      addToast(`Recalling Token ${nextPatient.token}`, "info");
    } 
    // 2. Waiting Queue
    else if (waitingQueue.length > 0) {
      setWaitingQueue(prev => {
        nextPatient = prev[0];
        return prev.slice(1);
      });
    }

    if (nextPatient) {
      setCurrentToken(nextPatient);
      addToast(`📱 SMS: Token ${nextPatient.token} to counter.`, "sms");
    } else {
      addToast("No patients in queue.", "info");
    }
  };

  const skipToken = () => {
    if (!currentToken) return;
    if (currentToken.recallCount >= 1) {
      if (window.confirm("Already recalled once. Cancel?")) {
        setCurrentToken(null);
        return;
      }
    }
    const skippedPatient = { ...currentToken, skippedAt: Date.now() };
    setRecallQueue(prev => [...prev, skippedPatient]);
    setCurrentToken(null);
    addToast(`📱 SMS: Token ${skippedPatient.token} skipped.`, "sms");
  };

  const removePatientFromQueue = (id) => {
    setWaitingQueue(prev => prev.filter(p => p.id !== id));
    addToast("Patient removed from queue.", "info");
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

  // Note: removed forced recallQueue re-setting to avoid infinite update loop

  return (
    <QueueContext.Provider value={{
      user, setUser,
      isActive, setIsActive,
      currentToken, timer,
      waitingQueue, recallQueue,
      addToast, removeToast, toasts,
      enableQueue, disableQueue,
      simulateJoin, callNext, skipToken, cancelToken,
      removePatientFromQueue, markPatientMissed
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => useContext(QueueContext);