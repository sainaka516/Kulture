-- CreateTable
CREATE TABLE "ViewedTake" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "takeId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViewedTake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ViewedTake_userId_idx" ON "ViewedTake"("userId");

-- CreateIndex
CREATE INDEX "ViewedTake_takeId_idx" ON "ViewedTake"("takeId");

-- CreateIndex
CREATE UNIQUE INDEX "ViewedTake_userId_takeId_key" ON "ViewedTake"("userId", "takeId");

-- AddForeignKey
ALTER TABLE "ViewedTake" ADD CONSTRAINT "ViewedTake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ViewedTake" ADD CONSTRAINT "ViewedTake_takeId_fkey" FOREIGN KEY ("takeId") REFERENCES "Take"("id") ON DELETE CASCADE ON UPDATE CASCADE;
