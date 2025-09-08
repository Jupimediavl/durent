-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS "subscriptionType" VARCHAR(20) DEFAULT 'FREE';

-- Create invites table if it doesn't exist
CREATE TABLE IF NOT EXISTS invites (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    "usedBy" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP WITH TIME ZONE
);

-- Update existing users to have the new columns
UPDATE users 
SET credits = 50, "subscriptionType" = 'FREE' 
WHERE credits IS NULL OR "subscriptionType" IS NULL;