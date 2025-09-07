-- Create table to track premium actions (chat and contact details)
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS "premium_actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL, -- 'CHAT_WITH_OWNER' or 'VIEW_CONTACT_DETAILS'
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "premium_actions_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
ALTER TABLE "premium_actions" ADD CONSTRAINT "premium_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "premium_actions" ADD CONSTRAINT "premium_actions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create unique constraint for user + property + action type
CREATE UNIQUE INDEX IF NOT EXISTS "premium_actions_user_property_action_key" ON "premium_actions"("userId", "propertyId", "actionType");

SELECT 'Premium actions table created successfully' as status;