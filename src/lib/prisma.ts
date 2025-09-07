import { PrismaClient } from '@prisma/client'

// Global singleton pattern for Prisma Client
declare global {
  var __prisma: PrismaClient | undefined
}

// Optimize Prisma Client with connection pooling settings
export const prisma = globalThis.__prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma
}