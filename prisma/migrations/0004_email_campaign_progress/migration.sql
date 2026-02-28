-- AlterTable
ALTER TABLE "EmailCampaign" ADD COLUMN     "recipientTotal" INTEGER;
ALTER TABLE "EmailCampaign" ADD COLUMN     "sentCount" INTEGER NOT NULL DEFAULT 0;

