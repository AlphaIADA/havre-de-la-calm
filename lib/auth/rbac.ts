import { redirect } from 'next/navigation';

import type { SessionPayload } from '@/lib/auth/session';
import { getSession } from '@/lib/auth/session';

export async function requireStaff(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN' && session.role !== 'STAFF') redirect('/admin/login');
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect('/admin/login');
  if (session.role !== 'ADMIN') redirect('/admin/login');
  return session;
}

