import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] Connecté à PostgreSQL');
  } catch (err) {
    console.error('\n[DB] Impossible de se connecter à PostgreSQL.\n');
    console.error('Vérifiez que :');
    console.error('  1. PostgreSQL tourne (docker compose up -d  OU  service postgresql start)');
    console.error('  2. DATABASE_URL dans apps/server/.env est correct');
    console.error('     → postgresql://mymeet:mymeet@localhost:5432/mymeet');
    console.error('  3. Le schéma est appliqué : pnpm db:push (depuis apps/server)\n');
    console.error('Détail :', (err as Error).message);
    throw err;
  }
}
