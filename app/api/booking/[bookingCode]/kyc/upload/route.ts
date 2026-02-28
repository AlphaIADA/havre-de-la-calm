import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';
import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';

const uploadSchema = z.object({
  kind: z.enum(['ID_FRONT', 'ID_BACK', 'SELFIE', 'PROOF_OF_ADDRESS']),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ bookingCode: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }
  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: 'Uploads not configured' }, { status: 503 });
  }

  const { bookingCode } = await context.params;
  const form = await req.formData();
  const kindRaw = form.get('kind');
  const file = form.get('file');

  const { kind } = uploadSchema.parse({ kind: kindRaw });

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
  }

  const prisma = getPrisma();
  const booking = await prisma.booking.findUnique({
    where: { code: bookingCode },
    include: { kycProfile: true },
  });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const profileId =
    booking.kycProfile?.id ??
    (
      await prisma.kycProfile.create({
        data: {
          bookingId: booking.id,
          status: 'PENDING',
          fullName: booking.guestName,
          email: booking.guestEmail,
          phone: booking.guestPhone,
        },
        select: { id: true },
      })
    ).id;

  const buffer = Buffer.from(await file.arrayBuffer());
  const resourceType = file.type?.startsWith('image/') ? 'image' : 'raw';
  const cloudinary = getCloudinary();

  type UploadResult = {
    public_id: string;
    resource_type: string;
    format?: string;
    bytes?: number;
    version?: number;
  };

  const uploadResult = await new Promise<UploadResult>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        type: 'private',
        folder: `ota/kyc/${booking.code}`,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadResult);
      },
    );
    stream.end(buffer);
  });

  const doc = await prisma.kycDocument.create({
    data: {
      profileId,
      kind,
      status: 'PENDING',
      storageProvider: 'cloudinary',
      storageKey: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      meta: {
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        version: uploadResult.version,
      },
    },
    select: { id: true, kind: true, status: true, createdAt: true },
  });

  return NextResponse.json({ document: doc });
}
