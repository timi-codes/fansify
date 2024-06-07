/*
  Warnings:

  - Added the required column `trxHash` to the `trade_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trade_requests" ADD COLUMN     "trxHash" TEXT NOT NULL;
