export function setupSignaling(io, socket) {
  socket.on('webrtc-offer',   ({ to, offer })       => io.to(to).emit('webrtc-offer',   { from: socket.id, offer }));
  socket.on('webrtc-answer',  ({ to, answer })      => io.to(to).emit('webrtc-answer',  { from: socket.id, answer }));
  socket.on('webrtc-ice',     ({ to, candidate })   => io.to(to).emit('webrtc-ice',     { from: socket.id, candidate }));
}
