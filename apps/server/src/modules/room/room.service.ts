import { prisma } from '../../config/database';
import { randomBytes } from 'crypto';

function generateSlug(): string {
  return randomBytes(4).toString('hex');
}

export async function createRoom(userId: string, name?: string, maxParticipants = 10) {
  let slug = generateSlug();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.room.findUnique({ where: { slug } });
    if (!existing) break;
    slug = generateSlug();
    attempts++;
  }

  return prisma.room.create({
    data: { slug, name, createdBy: userId, maxParticipants },
  });
}

export async function getRoomBySlug(slug: string) {
  return prisma.room.findUnique({
    where: { slug },
    include: {
      participants: {
        where: { leftAt: null },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
    },
  });
}

export async function joinRoom(slug: string, userId: string, socketId: string) {
  const room = await getRoomBySlug(slug);
  if (!room || !room.isActive) throw new Error('Room introuvable');

  const activeCount = room.participants.length;
  if (activeCount >= room.maxParticipants) {
    throw new Error('Room pleine');
  }

  const existing = room.participants.find((p) => p.userId === userId);
  if (existing) {
    return prisma.roomParticipant.update({
      where: { id: existing.id },
      data: { socketId, leftAt: null },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
  }

  return prisma.roomParticipant.create({
    data: { roomId: room.id, userId, socketId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function leaveRoom(participantId: string) {
  return prisma.roomParticipant.update({
    where: { id: participantId },
    data: { leftAt: new Date() },
  });
}

export async function getRoomMessages(slug: string) {
  const room = await prisma.room.findUnique({ where: { slug } });
  if (!room) throw new Error('Room introuvable');

  return prisma.message.findMany({
    where: { roomId: room.id },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    take: 100,
  });
}

export async function createMessage(roomId: string, userId: string, content: string) {
  return prisma.message.create({
    data: { roomId, userId, content },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
}

export async function updateParticipantState(
  participantId: string,
  data: { isMuted?: boolean; isVideoOn?: boolean; isScreenSharing?: boolean }
) {
  return prisma.roomParticipant.update({
    where: { id: participantId },
    data,
  });
}
