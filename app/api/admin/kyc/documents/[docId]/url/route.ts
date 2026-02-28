import { NextResponse } from 'next/server';

import { getCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';

function guessFormat(mimeType?: string | null, meta?: unknown) {
  if (meta && typeof meta === 'object') {
    const format = (meta as Record<string, unknown>).format;
    if (typeof format === 'string') return format;
  }
  if (!mimeType) return 'jpg';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpg';
  return 'jpg';
}

export async function GET(req: Request, context: { params: Promise<{ docId: string }> }) {
  const { response } = await requireStaffApi();
  if (response) return response;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Uploads not configured' }, { status: 503 });
  }

  const { docId } = await context.params;
  const prisma = getPrisma();
  const doc = await prisma.kycDocument.findUnique({ where: { id: docId } });
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  const cloudinary = getCloudinary();
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 5;
  const format = guessFormat(doc.mimeType, doc.meta);

  const url = cloudinary.utils.private_download_url(doc.storageKey, format, {
    type: 'private',
    resource_type: doc.resourceType ?? 'raw',
    expires_at: expiresAt,
    attachment: false,
  });

  return NextResponse.json({ url, expiresAt });
}
