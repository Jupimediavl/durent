-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionType" TEXT DEFAULT 'FREE';

-- Update existing invites table to match new schema
-- First, rename columns if they exist with the old names
DO $$
BEGIN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invites' AND column_name='createdById') THEN
        -- If ownerId exists, rename it, otherwise add createdById
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invites' AND column_name='ownerId') THEN
            ALTER TABLE invites RENAME COLUMN "ownerId" TO "createdById";
        ELSE
            ALTER TABLE invites ADD COLUMN "createdById" TEXT;
        END IF;
    END IF;

    -- Add usedById if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invites' AND column_name='usedById') THEN
        -- If usedBy exists, rename it, otherwise add usedById
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invites' AND column_name='usedBy') THEN
            ALTER TABLE invites RENAME COLUMN "usedBy" TO "usedById";
        ELSE
            ALTER TABLE invites ADD COLUMN "usedById" TEXT;
        END IF;
    END IF;

    -- Add usedAt if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invites' AND column_name='usedAt') THEN
        ALTER TABLE invites ADD COLUMN "usedAt" TIMESTAMP(3);
    END IF;

    -- Make expiresAt NOT NULL if it's nullable and add default
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invites' AND column_name='expiresAt' AND is_nullable='YES') THEN
        UPDATE invites SET "expiresAt" = "createdAt" + INTERVAL '7 days' WHERE "expiresAt" IS NULL;
        ALTER TABLE invites ALTER COLUMN "expiresAt" SET NOT NULL;
    END IF;

    -- Drop old columns if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invites' AND column_name='used') THEN
        ALTER TABLE invites DROP COLUMN used;
    END IF;
END
$$;

-- Create payment_transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT NOT NULL PRIMARY KEY,
    "stripePaymentIntentId" TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'aed',
    status TEXT NOT NULL DEFAULT 'PENDING',
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "propertyId" TEXT,
    "inviteCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS invites_code_idx ON invites(code);
CREATE INDEX IF NOT EXISTS invites_propertyid_idx ON invites("propertyId");
CREATE INDEX IF NOT EXISTS invites_createdbyid_idx ON invites("createdById");
CREATE INDEX IF NOT EXISTS payment_transactions_userid_idx ON payment_transactions("userId");
CREATE INDEX IF NOT EXISTS payment_transactions_stripe_idx ON payment_transactions("stripePaymentIntentId");