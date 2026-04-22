export function initQueueSocket(io) {
  io.on('connection', (socket) => {
    socket.on('patient:join', (patientId) => {
      if (!patientId) return;
      socket.join(`patient:${String(patientId)}`);
    });

    socket.on('patient:leave', (patientId) => {
      if (!patientId) return;
      socket.leave(`patient:${String(patientId)}`);
    });

    socket.on('queue:join', (doctorId) => {
      if (!doctorId) return;
      socket.join(`queue:${String(doctorId)}`);
    });

    socket.on('queue:leave', (doctorId) => {
      if (!doctorId) return;
      socket.leave(`queue:${String(doctorId)}`);
    });
  });
}
