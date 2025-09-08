-- Create pricing_plans table
CREATE TABLE "pricing_plans" (
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

-- Create unique constraint for actionType
CREATE UNIQUE INDEX "pricing_plans_actionType_key" ON "pricing_plans"("actionType");

-- Insert initial pricing data
INSERT INTO "pricing_plans" ("id", "actionType", "name", "description", "cost", "isActive", "createdAt", "updatedAt") VALUES
('pricing_view_details', 'VIEW_PROPERTY_DETAILS', 'Premium Property Details', 'Access all property details, amenities, and comprehensive information', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pricing_chat_owner', 'CHAT_WITH_OWNER', 'Chat with Owner', 'Start a conversation with the property owner through our secure messaging system', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('pricing_contact_details', 'VIEW_CONTACT_DETAILS', 'Owner Contact Details', 'View owner phone number and email for direct contact', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);