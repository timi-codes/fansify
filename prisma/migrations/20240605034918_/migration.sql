-- CreateTable
CREATE TABLE "trade_requests" (
    "id" SERIAL NOT NULL,
    "status" TEXT,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trade_requests" ADD CONSTRAINT "trade_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
