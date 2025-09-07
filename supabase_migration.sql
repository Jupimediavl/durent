-- Drop existing columns first to remove dependencies
ALTER TABLE "properties" DROP COLUMN IF EXISTS "propertyType";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "furnishingStatus";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "photos";

-- Drop columns that depend on status types
ALTER TABLE "payment_date_change_requests" DROP COLUMN IF EXISTS "status";
ALTER TABLE "end_requests" DROP COLUMN IF EXISTS "status";
ALTER TABLE "notifications" DROP COLUMN IF EXISTS "type";

-- Drop existing types if they exist (now safe after dropping columns)  
DROP TYPE IF EXISTS "PropertyType";
DROP TYPE IF EXISTS "FurnishingStatus";
DROP TYPE IF EXISTS "notification_type";
DROP TYPE IF EXISTS "change_request_status";
DROP TYPE IF EXISTS "end_request_status";

-- Add PropertyType and FurnishingStatus enums with correct snake_case names
CREATE TYPE "property_type" AS ENUM ('APARTMENT', 'VILLA', 'STUDIO', 'TOWNHOUSE', 'PENTHOUSE');
CREATE TYPE "furnishing_status" AS ENUM ('FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED');

-- Add notification and status enums
CREATE TYPE "notification_type" AS ENUM (
  'PAYMENT_REMINDER',
  'PAYMENT_OVERDUE', 
  'PAYMENT_APPROVED',
  'PAYMENT_REJECTED',
  'PAYMENT_VERIFICATION_NEEDED',
  'PAYMENT_DATE_CHANGE_REQUEST',
  'PAYMENT_DATE_CHANGE_APPROVED',
  'PAYMENT_DATE_CHANGE_REJECTED',
  'NEW_MESSAGE',
  'END_RENTAL_REQUEST',
  'END_RENTAL_AUTO_ACCEPT_WARNING',
  'NEW_TENANT_JOINED',
  'INVITE_CODE_GENERATED'
);

CREATE TYPE "change_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
CREATE TYPE "end_request_status" AS ENUM ('PENDING', 'ACCEPTED', 'AUTO_ACCEPTED', 'CANCELLED');

-- Add new columns to properties table
ALTER TABLE "properties" 
ADD COLUMN "propertyType" "property_type" DEFAULT 'APARTMENT',
ADD COLUMN "furnishingStatus" "furnishing_status" DEFAULT 'UNFURNISHED',
ADD COLUMN "photos" TEXT[] DEFAULT '{}';

-- Re-add status columns with correct types
ALTER TABLE "payment_date_change_requests" 
ADD COLUMN "status" "change_request_status" DEFAULT 'PENDING';

ALTER TABLE "end_requests" 
ADD COLUMN "status" "end_request_status" DEFAULT 'PENDING';

ALTER TABLE "notifications" 
ADD COLUMN "type" "notification_type" NOT NULL;

-- Update existing properties to have default values
UPDATE "properties" 
SET 
  "propertyType" = 'APARTMENT',
  "furnishingStatus" = 'UNFURNISHED',
  "photos" = '{}'
WHERE "propertyType" IS NULL OR "furnishingStatus" IS NULL OR "photos" IS NULL;