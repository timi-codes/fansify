/*
  Warnings:

  - Added the required column `tokenId` to the `memberships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "memberships" ADD COLUMN     "tokenId" TEXT NOT NULL;
