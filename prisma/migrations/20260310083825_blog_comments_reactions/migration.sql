-- CreateEnum
CREATE TYPE "BlogCommentStatus" AS ENUM ('PENDING', 'APPROVED', 'HIDDEN');

-- CreateTable
CREATE TABLE "BlogComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "status" "BlogCommentStatus" NOT NULL DEFAULT 'PENDING',
    "name" TEXT NOT NULL,
    "email" TEXT,
    "body" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "moderatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogComment_postId_idx" ON "BlogComment"("postId");

-- CreateIndex
CREATE INDEX "BlogComment_status_idx" ON "BlogComment"("status");

-- CreateIndex
CREATE INDEX "BlogReaction_postId_idx" ON "BlogReaction"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogReaction_postId_emoji_key" ON "BlogReaction"("postId", "emoji");

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogComment" ADD CONSTRAINT "BlogComment_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogReaction" ADD CONSTRAINT "BlogReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
