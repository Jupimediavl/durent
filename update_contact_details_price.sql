-- Update VIEW_CONTACT_DETAILS price to 5 credits
UPDATE "pricing_plans" 
SET cost = 5 
WHERE "actionType" = 'VIEW_CONTACT_DETAILS';

-- Insert or update VIEW_PROPERTY_DETAILS price to 1 credit
INSERT INTO "pricing_plans" (id, "actionType", "name", "description", "cost", "isActive")
VALUES (gen_random_uuid()::text, 'VIEW_PROPERTY_DETAILS', 'Premium Property Details', 'Access all property details and amenities', 1, true)
ON CONFLICT ("actionType") DO UPDATE SET
  cost = 1,
  name = 'Premium Property Details',
  description = 'Access all property details and amenities',
  "isActive" = true;

-- Verify the updates
SELECT * FROM "pricing_plans" WHERE "actionType" IN ('VIEW_CONTACT_DETAILS', 'VIEW_PROPERTY_DETAILS') ORDER BY "actionType";