export function initQueueSocket(io) {
  io.on('connection', (socket) => {
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
