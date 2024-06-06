/*
  Warnings:

  - You are about to drop the column `tag` on the `memberships` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "memberships_tag_key";

-- AlterTable
ALTER TABLE "memberships" DROP COLUMN "tag",
ADD COLUMN     "collectionTag" TEXT;
