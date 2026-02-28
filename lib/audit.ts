import type { Prisma, PrismaClient } from '@prisma/client';

export async function writeAuditLog(
  prisma: PrismaClient,
  input: {
    actorId?: string | null;
    action: string;
    entityType?: string | null;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
  },
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch {
    // Non-blocking: audit log failures should not break primary workflows
  }
}
