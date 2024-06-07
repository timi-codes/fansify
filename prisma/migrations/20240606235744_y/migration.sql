/*
  Warnings:

  - Added the required column `offeredId` to the `trade_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedId` to the `trade_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trade_requests" ADD COLUMN     "offeredId" INTEGER NOT NULL,
ADD COLUMN     "requestedId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "trade_requests" ADD CONSTRAINT "trade_requests_requestedId_fkey" FOREIGN KEY ("requestedId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_requests" ADD CONSTRAINT "trade_requests_offeredId_fkey" FOREIGN KEY ("offeredId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
