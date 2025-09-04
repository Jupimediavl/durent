-- CreateEnum
CREATE TYPE "public"."change_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."payment_date_change_requests" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "currentDate" INTEGER NOT NULL,
    "proposedDate" INTEGER NOT NULL,
    "proposedById" TEXT NOT NULL,
    "respondedById" TEXT,
    "status" "public"."change_request_status" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "responseNote" TEXT,
    "responseDate" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_date_change_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."payment_date_change_requests" ADD CONSTRAINT "payment_date_change_requests_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_date_change_requests" ADD CONSTRAINT "payment_date_change_requests_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payment_date_change_requests" ADD CONSTRAINT "payment_date_change_requests_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
