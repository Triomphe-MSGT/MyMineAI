const rooms = new Map(); // roomId → { participants: Map<socketId, participantData> }

export function setupRoomHandlers(io, socket) {

  socket.on('join-room', ({ roomId, participant }) => {
    // participant = { id, name, profile, isMuted, videoEnabled }
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.participant = participant;

    if (!rooms.has(roomId)) rooms.set(roomId, { participants: new Map() });
    rooms.get(roomId).participants.set(socket.id, participant);

    // Envoyer la liste actuelle au nouvel arrivant
    const existing = [...rooms.get(roomId).participants.entries()]
      .filter(([sid]) => sid !== socket.id)
      .map(([sid, p]) => ({ socketId: sid, ...p }));
    socket.emit('room-participants', existing);

    // Annoncer le nouvel arrivant aux autres
    socket.to(roomId).emit('participant-joined', { socketId: socket.id, ...participant });
  });

  socket.on('update-state', ({ isMuted, videoEnabled, handRaised, isSpeaking }) => {
    const { roomId, participant } = socket.data;
    if (!roomId || !participant) return;
    Object.assign(participant, { isMuted, videoEnabled, handRaised, isSpeaking });
    socket.to(roomId).emit('participant-updated', { socketId: socket.id, ...participant });
  });

  socket.on('disconnect', () => {
    const { roomId } = socket.data;
    if (!roomId || !rooms.has(roomId)) return;
    rooms.get(roomId).participants.delete(socket.id);
    io.to(roomId).emit('participant-left', { socketId: socket.id });
    if (rooms.get(roomId).participants.size === 0) rooms.delete(roomId);
  });
}
