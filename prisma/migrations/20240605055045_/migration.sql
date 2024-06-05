/*
  Warnings:

  - A unique constraint covering the columns `[ethereumAddress]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ethereumAddress` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `privateKeyDigest` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ethereumAddress" TEXT NOT NULL,
ADD COLUMN     "privateKeyDigest" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_ethereumAddress_key" ON "users"("ethereumAddress");
