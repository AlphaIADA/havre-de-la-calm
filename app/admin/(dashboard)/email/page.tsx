import { EmailMarketingManager } from '@/components/admin/EmailMarketingManager';
import { isResendConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Email' };
export const dynamic = 'force-dynamic';

export default async function AdminEmailPage() {
  const prisma = getPrisma();
  const [segments, campaigns] = await Promise.all([
    prisma.emailSegment.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.emailCampaign.findMany({ include: { segment: true }, orderBy: { createdAt: 'desc' } }),
  ]);

  const viewSegments = segments.map((s) => ({
    id: s.id,
    name: s.name,
    criteria: s.criteria,
    createdAt: s.createdAt.toISOString(),
  }));

  const viewCampaigns = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    subject: c.subject,
    status: c.status,
    segmentId: c.segmentId,
    segmentName: c.segment?.name ?? null,
    sentCount: c.sentCount,
    recipientTotal: c.recipientTotal,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <EmailMarketingManager
      segments={viewSegments}
      campaigns={viewCampaigns}
      resendEnabled={isResendConfigured()}
    />
  );
}
