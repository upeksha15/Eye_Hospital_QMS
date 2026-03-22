import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000';

export function useSocket(selectedDoctorId, onQueueUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('queue:update', (data) => {
      if (!selectedDoctorId) return;
      if (String(data.doctorId) === String(selectedDoctorId)) {
        onQueueUpdate?.(data);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDoctorId, onQueueUpdate]);

  return socketRef;
}
