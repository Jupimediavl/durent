-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 7,
ALTER COLUMN "paymentDueDay" DROP NOT NULL,
ALTER COLUMN "paymentDueDay" DROP DEFAULT;
