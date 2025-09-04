-- Add missing columns to existing tables
-- Run this in Supabase SQL Editor

-- Add isPublic, availabilityStatus, and availabilityDays to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "availabilityStatus" TEXT,
ADD COLUMN IF NOT EXISTS "availabilityDays" INTEGER;

-- Fix notifications table - add body column and other missing ones
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS "body" TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP(3);

-- Update notification_settings table structure to match Prisma schema
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS "paymentUpdates" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "messages" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "endRentalNotifications" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "tenantUpdates" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "paymentDateChangeRequests" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "reminderDaysBefore" INTEGER DEFAULT 3;

-- Remove old columns if they exist
ALTER TABLE public.notification_settings 
DROP COLUMN IF EXISTS "pushNotifications",
DROP COLUMN IF EXISTS "emailNotifications",
DROP COLUMN IF EXISTS "messageNotifications",  
DROP COLUMN IF EXISTS "rentalUpdates";

SELECT 'Missing columns added successfully!' as result;