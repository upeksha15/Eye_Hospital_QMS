import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000';

export function useSocket(selectedDoctorId, onQueueUpdate, onSlotsUpdate, onQueueStatus, patientId, onPatientNotification) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    if (selectedDoctorId) {
      socket.emit('queue:join', String(selectedDoctorId));
    }

    if (patientId) {
      socket.emit('patient:join', String(patientId));
    }

    socket.on('queue:update', (data) => {
      if (!selectedDoctorId) return;
      if (String(data.doctorId) === String(selectedDoctorId)) {
        onQueueUpdate?.(data);
      }
    });

    socket.on('queue:status', (data) => {
      if (!selectedDoctorId) return;
      if (String(data.doctorId) === String(selectedDoctorId)) {
        onQueueUpdate?.({ ...data, action: 'status' });
        onQueueStatus?.(data);
      }
    });

    socket.on('patient:notification', (data) => {
      onPatientNotification?.(data);
    });

    socket.on('slots:update', (data) => {
      if (!selectedDoctorId) return;
      if (String(data.doctorId) === String(selectedDoctorId)) {
        onSlotsUpdate?.(data);
      }
    });

    return () => {
      try {
        if (selectedDoctorId) socket.emit('queue:leave', String(selectedDoctorId));
        if (patientId) socket.emit('patient:leave', String(patientId));
      } catch {
        // ignore
      }
      socket.disconnect();
    };
  }, [selectedDoctorId, onQueueUpdate, onSlotsUpdate, onQueueStatus, patientId, onPatientNotification]);

  return socketRef;
}
