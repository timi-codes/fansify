/*
  Warnings:

  - You are about to drop the column `creatorAddress` on the `memberships` table. All the data in the column will be lost.
  - You are about to drop the column `ownerAddress` on the `memberships` table. All the data in the column will be lost.
  - Added the required column `creatorId` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `memberships` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_creatorAddress_fkey";

-- DropForeignKey
ALTER TABLE "memberships" DROP CONSTRAINT "memberships_ownerAddress_fkey";

-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "creatorAddress",
DROP COLUMN "ownerAddress",
ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
