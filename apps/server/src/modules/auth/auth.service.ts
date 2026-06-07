import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { getUserByEmail } from '../user/user.service';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function signToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

export async function register(email: string, password: string, name: string) {
  const existing = await getUserByEmail(email);
  if (existing) throw new Error('Email déjà utilisé');

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hash, name },
    select: { id: true, email: true, name: true, avatar: true },
  });

  const token = signToken(user.id, user.email);
  return { user, token };
}

export async function login(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user) throw new Error('Identifiants invalides');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Identifiants invalides');

  const token = signToken(user.id, user.email);
  return {
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar },
    token,
  };
}
