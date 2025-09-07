const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixSchema() {
  try {
    console.log('🔧 Fixing database schema...')
    
    // Add missing columns to users table
    await prisma.$executeRaw`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50,
      ADD COLUMN IF NOT EXISTS "subscriptionType" VARCHAR(20) DEFAULT 'FREE'
    `
    
    // Create invites table if it doesn't exist  
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS invites (
          id TEXT PRIMARY KEY,
          code TEXT UNIQUE NOT NULL,
          "propertyId" TEXT NOT NULL,
          "ownerId" TEXT NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          "usedBy" TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          "expiresAt" TIMESTAMP WITH TIME ZONE
      )
    `
    
    // Update existing users to have the new columns
    await prisma.$executeRaw`
      UPDATE users 
      SET credits = 50, "subscriptionType" = 'FREE' 
      WHERE credits IS NULL OR "subscriptionType" IS NULL
    `
    
    console.log('✅ Database schema fixed successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSchema()