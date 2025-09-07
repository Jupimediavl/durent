-- Add missing columns to users table (lowercase)
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionType" TEXT DEFAULT 'FREE';

-- Create invite table if it doesn't exist (lowercase)
CREATE TABLE IF NOT EXISTS invite (
    id TEXT NOT NULL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    "propertyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("usedById") REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create payment_transactions table if it doesn't exist (lowercase)
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
CREATE INDEX IF NOT EXISTS invite_code_idx ON invite(code);
CREATE INDEX IF NOT EXISTS invite_propertyid_idx ON invite("propertyId");
CREATE INDEX IF NOT EXISTS payment_transactions_userid_idx ON payment_transactions("userId");
CREATE INDEX IF NOT EXISTS payment_transactions_stripe_idx ON payment_transactions("stripePaymentIntentId");