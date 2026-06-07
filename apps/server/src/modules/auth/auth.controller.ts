import { Request, Response } from 'express';
import { register, login } from './auth.service';
import { getUserById } from '../user/user.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export async function registerHandler(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Champs requis: email, password, name' });
    }
    const result = await register(email, password, name);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Champs requis: email, password' });
    }
    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
}

export async function meHandler(req: AuthRequest, res: Response) {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
}
