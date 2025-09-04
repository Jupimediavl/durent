-- Doar adaugă coloanele lipsă dacă nu există
DO $$ 
BEGIN
    -- Add propertyType column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='properties' AND column_name='propertyType') THEN
        ALTER TABLE "properties" ADD COLUMN "propertyType" "property_type" DEFAULT 'APARTMENT';
    END IF;
    
    -- Add furnishingStatus column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='properties' AND column_name='furnishingStatus') THEN
        ALTER TABLE "properties" ADD COLUMN "furnishingStatus" "furnishing_status" DEFAULT 'UNFURNISHED';
    END IF;
    
    -- Add photos column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='properties' AND column_name='photos') THEN
        ALTER TABLE "properties" ADD COLUMN "photos" TEXT[] DEFAULT '{}';
    END IF;
    
    -- Add notification type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='notifications' AND column_name='type') THEN
        ALTER TABLE "notifications" ADD COLUMN "type" "notification_type";
    END IF;
END $$;