import { randomBytes } from 'crypto';
import type { PrismaClient } from '@prisma/client';

export async function generateUniqueBookingCode(prisma: PrismaClient) {
  for (let i = 0; i < 10; i++) {
    const code = randomBytes(6).toString('hex').toUpperCase();
    const exists = await prisma.booking.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate booking code. Please try again.');
}

