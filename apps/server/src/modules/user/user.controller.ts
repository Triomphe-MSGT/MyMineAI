import { Response } from 'express';
import { getUserById } from './user.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function getUserHandler(req: AuthRequest, res: Response) {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
