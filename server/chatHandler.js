export function setupChat(io, socket) {
  socket.on('chat-message', ({ roomId, message }) => {
    // message = { id, senderId, senderName, senderProfile, text, timestamp }
    io.to(roomId).emit('chat-message', message);
  });
}
