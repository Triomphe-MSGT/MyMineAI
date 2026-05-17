export function setupTranscription(io, socket) {
  socket.on('transcription-chunk', ({ roomId, chunk }) => {
    // chunk = { speakerId, speakerName, speakerProfile, text, timestamp, isFinal }
    socket.to(roomId).emit('transcription-chunk', chunk);
  });

  socket.on('screen-share-start', ({ roomId, sharedBy }) => {
    io.to(roomId).emit('screen-share-start', { sharedBy });
  });

  socket.on('screen-share-stop', ({ roomId }) => {
    io.to(roomId).emit('screen-share-stop');
  });

  socket.on('screen-share-description', ({ roomId, description }) => {
    // description = { text, presenterNote, combinedForBlind }
    io.to(roomId).emit('screen-share-description', description);
  });
}
