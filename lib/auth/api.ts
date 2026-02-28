import { NextResponse } from 'next/server';

import { getSession } from '@/lib/auth/session';

export async function requireStaffApi() {
  const session = await getSession();
  if (!session) {
    return { session: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (session.role !== 'ADMIN' && session.role !== 'STAFF') {
    return { session: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session, response: null };
}

