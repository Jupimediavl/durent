-- Create the notification_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
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
            'END_RENTAL_WARNING',
            'RENTAL_ENDED',
            'RENTAL_AUTO_ENDED',
            'NEW_TENANT'
        );
    END IF;
END$$;

-- Check if notifications table exists and has correct structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications';