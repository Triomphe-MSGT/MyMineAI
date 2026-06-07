import { Response } from 'express';
import {
  createRoom,
  getRoomBySlug,
  joinRoom,
  getRoomMessages,
} from './room.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function createRoomHandler(req: AuthRequest, res: Response) {
  try {
    const { name, maxParticipants } = req.body;
    const room = await createRoom(req.user!.userId, name, maxParticipants);
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function getRoomHandler(req: AuthRequest, res: Response) {
  try {
    const room = await getRoomBySlug(req.params.slug);
    if (!room) return res.status(404).json({ error: 'Room introuvable' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}

export async function joinRoomHandler(req: AuthRequest, res: Response) {
  try {
    const { socketId } = req.body;
    const participant = await joinRoom(req.params.slug, req.user!.userId, socketId || '');
    res.json(participant);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function getMessagesHandler(req: AuthRequest, res: Response) {
  try {
    const messages = await getRoomMessages(req.params.slug);
    res.json(messages);
  } catch (err) {
    res.status(404).json({ error: (err as Error).message });
  }
}
