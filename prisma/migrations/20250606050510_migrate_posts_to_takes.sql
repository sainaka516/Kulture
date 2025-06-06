-- Create temporary table to store post data
CREATE TABLE IF NOT EXISTS "_PostBackup" AS 
SELECT * FROM "Post";

-- Rename Post table to Take
ALTER TABLE IF EXISTS "Post" RENAME TO "Take";

-- Update foreign key references in related tables
ALTER TABLE "Comment" RENAME COLUMN "postId" TO "takeId";
ALTER TABLE "Vote" RENAME COLUMN "postId" TO "takeId";

-- Update unique constraints
ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS "Vote_userId_postId_key";
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_userId_takeId_key" UNIQUE ("userId", "takeId");

-- Update indexes
DROP INDEX IF EXISTS "Post_authorId_idx";
DROP INDEX IF EXISTS "Post_communityId_idx";
DROP INDEX IF EXISTS "Vote_postId_idx";
DROP INDEX IF EXISTS "Comment_postId_idx";

CREATE INDEX "Take_authorId_idx" ON "Take"("authorId");
CREATE INDEX "Take_communityId_idx" ON "Take"("communityId");
CREATE INDEX "Vote_takeId_idx" ON "Vote"("takeId");
CREATE INDEX "Comment_takeId_idx" ON "Comment"("takeId"); 