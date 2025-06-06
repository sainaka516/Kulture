/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Post` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Community` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `Community` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Community` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Community` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_communityId_fkey";

-- First, add the new columns with default values
ALTER TABLE "Community" ADD COLUMN "slug" TEXT;
ALTER TABLE "Community" ADD COLUMN "title" TEXT;
ALTER TABLE "Community" ADD COLUMN "rules" TEXT;
ALTER TABLE "Community" ADD COLUMN "creatorId" TEXT;
ALTER TABLE "Community" ADD COLUMN "parentId" TEXT;

-- Update existing records with default values
UPDATE "Community" 
SET 
  "slug" = LOWER(name),
  "title" = name,
  "creatorId" = (SELECT id FROM "User" LIMIT 1);

-- Now make the columns required
ALTER TABLE "Community" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Community" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "Community" ALTER COLUMN "creatorId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "Community" ADD CONSTRAINT "Community_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Community" ADD CONSTRAINT "Community_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Community"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add unique constraints
CREATE UNIQUE INDEX "Community_slug_key" ON "Community"("slug");

-- Create moderators table
CREATE TABLE "CommunityModerator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommunityModerator_pkey" PRIMARY KEY ("id")
);

-- Add moderator constraints and indexes
CREATE UNIQUE INDEX "CommunityModerator_userId_communityId_key" ON "CommunityModerator"("userId", "communityId");
CREATE INDEX "CommunityModerator_userId_idx" ON "CommunityModerator"("userId");
CREATE INDEX "CommunityModerator_communityId_idx" ON "CommunityModerator"("communityId");

ALTER TABLE "CommunityModerator" ADD CONSTRAINT "CommunityModerator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CommunityModerator" ADD CONSTRAINT "CommunityModerator_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add the first user as moderator for existing communities
INSERT INTO "CommunityModerator" ("id", "userId", "communityId")
SELECT 
  gen_random_uuid()::text,
  "creatorId",
  "id"
FROM "Community";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "imageUrl";

-- CreateIndex
CREATE INDEX "Community_creatorId_idx" ON "Community"("creatorId");

-- CreateIndex
CREATE INDEX "Community_parentId_idx" ON "Community"("parentId");

-- CreateIndex
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- CreateIndex
CREATE INDEX "Post_communityId_idx" ON "Post"("communityId");
