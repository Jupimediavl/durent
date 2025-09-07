-- First, update any existing users with null phone numbers to have a placeholder
UPDATE "users" 
SET phone = '+971000000000' 
WHERE phone IS NULL OR phone = '';

-- Now make the phone column NOT NULL
ALTER TABLE "users" 
ALTER COLUMN phone SET NOT NULL;

-- Verify the changes
SELECT COUNT(*) as total_users, 
       COUNT(phone) as users_with_phone 
FROM "users";

SELECT id, name, phone 
FROM "users" 
WHERE phone = '+971000000000';