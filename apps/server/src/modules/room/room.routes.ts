import { Router } from 'express';
import {
  createRoomHandler,
  getRoomHandler,
  joinRoomHandler,
  getMessagesHandler,
} from './room.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createRoomHandler);
router.get('/:slug', authMiddleware, getRoomHandler);
router.post('/:slug/join', authMiddleware, joinRoomHandler);
router.get('/:slug/messages', authMiddleware, getMessagesHandler);

export default router;
