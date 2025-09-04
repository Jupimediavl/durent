-- AlterEnum
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'VERIFICATION';

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "paymentDueDay" INTEGER NOT NULL DEFAULT 1;
