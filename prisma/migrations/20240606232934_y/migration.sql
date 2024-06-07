/*
  Warnings:

  - Made the column `status` on table `trade_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "trade_requests" ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';
