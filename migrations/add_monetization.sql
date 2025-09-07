-- Add monetization columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(20) DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP;

-- Create subscription types enum
DO $$ BEGIN
  CREATE TYPE subscription_type AS ENUM ('FREE', 'MONTHLY', 'YEARLY', 'TRIAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create transaction types enum  
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('PURCHASE', 'USAGE', 'REFUND', 'BONUS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create credit transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  payment_method VARCHAR(50),
  transaction_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Set default free trial for new landlords (30 days)
UPDATE users 
SET trial_end_date = "createdAt" + INTERVAL '30 days'
WHERE "userType" = 'LANDLORD' AND trial_end_date IS NULL;