-- SQL commands to fix database schema for duRent
-- Run these commands in your Supabase SQL editor

-- 1. Add missing columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credits" INTEGER DEFAULT 100;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionType" TEXT DEFAULT 'FREE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionStartDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionEndDate" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "trialEndDate" TIMESTAMP(3);

-- 2. Create credit_transactions table if not exists
CREATE TABLE IF NOT EXISTS "credit_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- 3. Create property_views table if not exists
CREATE TABLE IF NOT EXISTS "property_views" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "property_views_pkey" PRIMARY KEY ("id")
);

-- 4. Create pricing_plans table if not exists
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

-- 5. Create subscriptions table if not exists
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- 6. Add foreign keys (ignore if they already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'credit_transactions_userId_fkey') THEN
        ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_views_userId_fkey') THEN
        ALTER TABLE "property_views" ADD CONSTRAINT "property_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'property_views_propertyId_fkey') THEN
        ALTER TABLE "property_views" ADD CONSTRAINT "property_views_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'subscriptions_userId_fkey') THEN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- 7. Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "property_views_userId_propertyId_key" ON "property_views"("userId", "propertyId");
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_plans_actionType_key" ON "pricing_plans"("actionType");

-- 8. Insert initial pricing data
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

-- 9. Update existing users to have default credit values
UPDATE "users" SET "credits" = 100 WHERE "credits" IS NULL;
UPDATE "users" SET "subscriptionType" = 'FREE' WHERE "subscriptionType" IS NULL;

-- 10. Verify schema is correct
SELECT 'Schema update completed successfully' as status;