/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "memberships_name_key" ON "memberships"("name");
