-- Drop old tables and columns
DROP TABLE IF EXISTS "CommunityMember";
DROP TABLE IF EXISTS "CommunityModerator";

-- Add new columns with default values
ALTER TABLE "Community" ADD COLUMN "ownerId" TEXT;
ALTER TABLE "Vote" ADD COLUMN "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Update existing data
UPDATE "Community" SET "ownerId" = COALESCE("creatorId", (SELECT id FROM "User" LIMIT 1));
UPDATE "Vote" SET "updatedAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

-- Make columns required
ALTER TABLE "Community" ALTER COLUMN "ownerId" SET NOT NULL;
ALTER TABLE "Vote" ALTER COLUMN "updatedAt" SET NOT NULL;

-- Drop old columns
ALTER TABLE "Community" DROP COLUMN IF EXISTS "creatorId";
ALTER TABLE "Community" DROP COLUMN IF EXISTS "rules";
ALTER TABLE "Community" DROP COLUMN IF EXISTS "title";
ALTER TABLE "User" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "karma";
ALTER TABLE "User" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "Vote" DROP COLUMN IF EXISTS "value";

-- Add new indexes
CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Community_ownerId_idx" ON "Community"("ownerId");
CREATE INDEX IF NOT EXISTS "Community_parentId_idx" ON "Community"("parentId");
CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX IF NOT EXISTS "Post_communityId_idx" ON "Post"("communityId");
CREATE INDEX IF NOT EXISTS "Vote_userId_idx" ON "Vote"("userId");
CREATE INDEX IF NOT EXISTS "Vote_postId_idx" ON "Vote"("postId");
CREATE INDEX IF NOT EXISTS "Comment_authorId_idx" ON "Comment"("authorId");
CREATE INDEX IF NOT EXISTS "Comment_postId_idx" ON "Comment"("postId"); 