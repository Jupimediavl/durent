-- Minimal SQL fix to get the backend working
-- Run this in Supabase SQL editor

-- 1. Just add missing columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credits" INTEGER DEFAULT 100;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionType" TEXT DEFAULT 'FREE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMP(3);

-- 2. Create pricing_plans table (essential for the premium features)
CREATE TABLE IF NOT EXISTS "pricing_plans" (
    "id" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "pricing_plans_pkey" PRIMARY KEY ("id")
);

-- 3. Create unique constraint for actionType
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_plans_actionType_key" ON "pricing_plans"("actionType");

-- 4. Insert pricing data
INSERT INTO "pricing_plans" ("id", "actionType", "name", "description", "cost", "isActive", "createdAt", "updatedAt") VALUES
('pricing_view_details', 'VIEW_PROPERTY_DETAILS', 'Premium Property Details', 'Access all property details, amenities, and comprehensive information', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pricing_chat_owner', 'CHAT_WITH_OWNER', 'Chat with Owner', 'Start a conversation with the property owner through our secure messaging system', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pricing_contact_details', 'VIEW_CONTACT_DETAILS', 'Owner Contact Details', 'View owner phone number and email for direct contact', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("actionType") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "cost" = EXCLUDED."cost",
    "isActive" = EXCLUDED."isActive",
    "updatedAt" = CURRENT_TIMESTAMP;

-- 5. Update existing users
UPDATE "users" SET "credits" = 100 WHERE "credits" IS NULL;
UPDATE "users" SET "subscriptionType" = 'FREE' WHERE "subscriptionType" IS NULL;

-- Success message
SELECT 'Essential schema updates completed - backend should work now' as status;