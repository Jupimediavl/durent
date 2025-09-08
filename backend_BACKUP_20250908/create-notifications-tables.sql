-- Create notification tables manually if migration fails

-- Notification types enum
CREATE TYPE "NotificationType" AS ENUM (
  'PAYMENT_REMINDER',
  'PAYMENT_OVERDUE', 
  'PAYMENT_APPROVED',
  'PAYMENT_REJECTED',
  'PAYMENT_VERIFICATION_NEEDED',
  'NEW_MESSAGE',
  'END_RENTAL_REQUEST',
  'END_RENTAL_AUTO_ACCEPT_WARNING',
  'NEW_TENANT_JOINED',
  'PAYMENT_DATE_CHANGE_REQUEST',
  'PAYMENT_DATE_CHANGE_APPROVED',
  'PAYMENT_DATE_CHANGE_REJECTED'
);

-- Notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}',
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" TIMESTAMP(3),
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- Notification settings table  
CREATE TABLE IF NOT EXISTS "notification_settings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "paymentReminders" BOOLEAN NOT NULL DEFAULT true,
  "paymentUpdates" BOOLEAN NOT NULL DEFAULT true,
  "messages" BOOLEAN NOT NULL DEFAULT true,
  "endRentalNotifications" BOOLEAN NOT NULL DEFAULT true,
  "tenantUpdates" BOOLEAN NOT NULL DEFAULT true,
  "paymentDateChangeRequests" BOOLEAN NOT NULL DEFAULT true,
  "reminderDaysBefore" INTEGER NOT NULL DEFAULT 3,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "notification_settings_userId_key" ON "notification_settings"("userId");

-- Add foreign key constraints if users table exists
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;