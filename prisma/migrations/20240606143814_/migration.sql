/*
  Warnings:

  - A unique constraint covering the columns `[tag]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[trxHash]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tag` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trxHash` to the `memberships` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "memberships_name_key";

-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "tag" TEXT NOT NULL,
ADD COLUMN     "trxHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "memberships_tag_key" ON "memberships"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_trxHash_key" ON "memberships"("trxHash");
