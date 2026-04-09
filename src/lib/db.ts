import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Check if DATABASE_URL is available
const DATABASE_URL = process.env.DATABASE_URL

// Helper to check if database is available
export function isDatabaseAvailable(): boolean {
  return !!DATABASE_URL
}

// Get the actual database URL being used
export function getDatabaseUrl(): string | undefined {
  return DATABASE_URL
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db