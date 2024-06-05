/*
  Warnings:

  - Added the required column `creatorId` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerEthereumAddress` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `memberships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "creatorId" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "ownerEthereumAddress" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'UNSOLD',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_ownerEthereumAddress_fkey" FOREIGN KEY ("ownerEthereumAddress") REFERENCES "users"("ethereumAddress") ON DELETE RESTRICT ON UPDATE CASCADE;
