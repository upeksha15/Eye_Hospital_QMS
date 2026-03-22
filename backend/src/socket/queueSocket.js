export function initQueueSocket(io) {
  io.on('connection', () => {
    // Real-time queue updates are emitted from controllers (e.g. check-in).
  });
}
