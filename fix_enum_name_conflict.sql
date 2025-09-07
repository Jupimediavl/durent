-- Fix enum name conflict - Prisma expects "NotificationType" but Supabase has "notification_type"
-- Run this script in Supabase SQL Editor AFTER running the first script

-- 1. Drop existing enum and tables to avoid conflicts
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TYPE IF EXISTS public.notification_type CASCADE;

-- 2. Create the enum with the exact name Prisma expects
CREATE TYPE public."NotificationType" AS ENUM (
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

-- 3. Create the notifications table with correct enum reference
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type public."NotificationType" NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 4. Create the notification_settings table
CREATE TABLE public.notification_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "pushNotifications" BOOLEAN DEFAULT true,
    "emailNotifications" BOOLEAN DEFAULT true,
    "paymentReminders" BOOLEAN DEFAULT true,
    "messageNotifications" BOOLEAN DEFAULT true,
    "rentalUpdates" BOOLEAN DEFAULT true,
    "userId" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- 5. Add indexes for better performance
CREATE INDEX idx_notifications_userId ON public.notifications("userId");
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_createdAt ON public.notifications("createdAt");

-- 6. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON public.notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant permissions
GRANT ALL ON public.notifications TO postgres, anon, authenticated;
GRANT ALL ON public.notification_settings TO postgres, anon, authenticated;

-- 9. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid()::text = "userId");

CREATE POLICY "System can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications FOR DELETE 
USING (auth.uid()::text = "userId");

-- 11. Create RLS policies for notification settings
CREATE POLICY "Users can view their own notification settings" 
ON public.notification_settings FOR SELECT 
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can update their own notification settings" 
ON public.notification_settings FOR UPDATE 
USING (auth.uid()::text = "userId");

CREATE POLICY "Users can insert their own notification settings" 
ON public.notification_settings FOR INSERT 
WITH CHECK (auth.uid()::text = "userId");

CREATE POLICY "Users can delete their own notification settings" 
ON public.notification_settings FOR DELETE 
USING (auth.uid()::text = "userId");

-- Success message
SELECT 'Enum conflict fixed! NotificationType enum and tables created successfully!' as result;