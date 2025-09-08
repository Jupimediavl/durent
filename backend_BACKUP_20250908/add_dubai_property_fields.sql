-- Add comprehensive property fields for Dubai rental market
-- Run this script manually in your Supabase SQL editor

-- Financial Information
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS "securityDeposit" INTEGER,
ADD COLUMN IF NOT EXISTS "commission" INTEGER DEFAULT 5,  -- Percentage
ADD COLUMN IF NOT EXISTS "dewaDeposit" INTEGER DEFAULT 2000,  -- AED
ADD COLUMN IF NOT EXISTS "paymentFrequency" INTEGER DEFAULT 12,  -- 1,2,4,6,12 payments per year
ADD COLUMN IF NOT EXISTS "noticePeriod" INTEGER DEFAULT 30;  -- Days

-- Property Specific Information  
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS "floorNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "totalFloors" INTEGER,
ADD COLUMN IF NOT EXISTS "buildingAge" INTEGER,  -- Years since construction
ADD COLUMN IF NOT EXISTS "parkingSpaces" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "balcony" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "yearBuilt" INTEGER;

-- Utilities and Amenities
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS "acType" VARCHAR(20) DEFAULT 'SPLIT',  -- CENTRAL, SPLIT, NONE
ADD COLUMN IF NOT EXISTS "chillerType" VARCHAR(10) DEFAULT 'PAID',  -- FREE, PAID
ADD COLUMN IF NOT EXISTS "internetIncluded" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "dewaIncluded" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "waterIncluded" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "kitchenAppliances" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "washingMachine" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "swimmingPool" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "gym" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "security24" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "maidRoom" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "studyRoom" BOOLEAN DEFAULT false;

-- Rules and Restrictions
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS "petsAllowed" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "smokingAllowed" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "tenantType" VARCHAR(20) DEFAULT 'ANY',  -- FAMILY, BACHELOR, ANY  
ADD COLUMN IF NOT EXISTS "minimumStay" INTEGER DEFAULT 12,  -- Months
ADD COLUMN IF NOT EXISTS "nationality" VARCHAR(50),  -- Preferred nationality if any
ADD COLUMN IF NOT EXISTS "gender" VARCHAR(10);  -- MALE, FEMALE, ANY for bachelor units

-- Legal and Documentation  
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS "reraPermit" VARCHAR(50),  -- RERA permit number
ADD COLUMN IF NOT EXISTS "municipalityNo" VARCHAR(50),  -- Municipality number
ADD COLUMN IF NOT EXISTS "titleDeedNo" VARCHAR(50),  -- Title deed number
ADD COLUMN IF NOT EXISTS "landlordId" VARCHAR(50);  -- Emirates ID of landlord

-- Additional Features
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS "viewType" VARCHAR(30),  -- SEA_VIEW, CITY_VIEW, GARDEN_VIEW, etc.
ADD COLUMN IF NOT EXISTS "furnished" TEXT,  -- JSON array of furnished items
ADD COLUMN IF NOT EXISTS "nearbyPlaces" TEXT,  -- JSON array of nearby landmarks
ADD COLUMN IF NOT EXISTS "buildingFacilities" TEXT,  -- JSON array of building facilities
ADD COLUMN IF NOT EXISTS "maintenanceContact" VARCHAR(20),  -- Maintenance phone number
ADD COLUMN IF NOT EXISTS "emergencyContact" VARCHAR(20);  -- Emergency contact

-- Comments for clarification
COMMENT ON COLUMN properties."securityDeposit" IS 'Security deposit amount in AED, typically 5-10% of annual rent';
COMMENT ON COLUMN properties."commission" IS 'Real estate commission percentage, typically 5%';
COMMENT ON COLUMN properties."chillerType" IS 'FREE means AC included in rent, PAID means tenant pays separately';
COMMENT ON COLUMN properties."paymentFrequency" IS 'Number of payments per year: 1,2,4,6,12';
COMMENT ON COLUMN properties."tenantType" IS 'FAMILY for families only, BACHELOR for singles, ANY for both';
COMMENT ON COLUMN properties."reraPermit" IS 'RERA permit number - legally required for rental properties in Dubai';
COMMENT ON COLUMN properties."viewType" IS 'Type of view from the property - important for pricing';

-- Create indexes for frequently queried fields
CREATE INDEX IF NOT EXISTS idx_properties_security_deposit ON properties("securityDeposit");
CREATE INDEX IF NOT EXISTS idx_properties_parking_spaces ON properties("parkingSpaces");  
CREATE INDEX IF NOT EXISTS idx_properties_building_age ON properties("buildingAge");
CREATE INDEX IF NOT EXISTS idx_properties_chiller_type ON properties("chillerType");
CREATE INDEX IF NOT EXISTS idx_properties_tenant_type ON properties("tenantType");
CREATE INDEX IF NOT EXISTS idx_properties_rera_permit ON properties("reraPermit");

-- Update existing properties with default values where appropriate
UPDATE properties 
SET 
  "commission" = 5,
  "dewaDeposit" = 2000,
  "paymentFrequency" = 12,
  "noticePeriod" = 30,
  "parkingSpaces" = 1,
  "acType" = 'SPLIT',
  "chillerType" = 'PAID',
  "tenantType" = 'ANY',
  "minimumStay" = 12
WHERE 
  "commission" IS NULL OR 
  "dewaDeposit" IS NULL OR 
  "paymentFrequency" IS NULL;

SELECT 'Dubai property fields added successfully!' as result;