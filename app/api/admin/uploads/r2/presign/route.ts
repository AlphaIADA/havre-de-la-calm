import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { writeAuditLog } from '@/lib/audit';
import { buildR2ObjectKey, getR2PublicUrlForKey, isR2Configured, presignR2PutObject } from '@/lib/r2';
import { getPrisma } from '@/lib/prisma';

const schema = z.object({
  prefix: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9/_-]+$/i, 'Invalid prefix'),
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  if (!isR2Configured()) {
    return NextResponse.json({ error: 'Uploads not configured' }, { status: 503 });
  }

  const data = schema.parse(await req.json());

  const prefix = data.prefix
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .toLowerCase();
  if (prefix.includes('..')) {
    return NextResponse.json({ error: 'Invalid prefix' }, { status: 400 });
  }
  if (!data.contentType.toLowerCase().startsWith('image/')) {
    return NextResponse.json({ error: 'Only image uploads are supported' }, { status: 400 });
  }

  const key = buildR2ObjectKey(prefix, data.fileName);
  const { uploadUrl, expiresInSeconds } = presignR2PutObject({ key });
  const publicUrl = getR2PublicUrlForKey(key);
  if (!publicUrl) {
    return NextResponse.json({ error: 'Missing CLOUDFLARE_R2_PUBLIC_URL' }, { status: 503 });
  }

  const prisma = getPrisma();
  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'UPLOAD_PRESIGN_R2',
    entityType: 'R2Object',
    entityId: key,
    metadata: { prefix, contentType: data.contentType },
  });

  return NextResponse.json({ key, uploadUrl, publicUrl, expiresInSeconds });
}

