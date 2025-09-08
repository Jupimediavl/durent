-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "subscriptionType" TEXT DEFAULT 'FREE';

-- Create Invite table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Invite" (
    id TEXT NOT NULL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    "propertyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("usedById") REFERENCES "User"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create PaymentTransaction table if it doesn't exist
CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
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
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("propertyId") REFERENCES "Property"(id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Invite_code_idx" ON "Invite"(code);
CREATE INDEX IF NOT EXISTS "Invite_propertyId_idx" ON "Invite"("propertyId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_userId_idx" ON "PaymentTransaction"("userId");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_stripePaymentIntentId_idx" ON "PaymentTransaction"("stripePaymentIntentId");