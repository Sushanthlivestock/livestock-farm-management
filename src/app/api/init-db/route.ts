import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Initialize database tables using raw SQL
export async function GET() {
  try {
    console.log('Checking database connection...');
    
    // Try a simple query
    const result = await db.$queryRaw`SELECT 1 as test`;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      result 
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('Creating database tables...');
    
    // Create tables using raw SQL
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Animal" (
        "id" TEXT PRIMARY KEY,
        "tagNumber" TEXT UNIQUE NOT NULL,
        "name" TEXT,
        "type" TEXT NOT NULL,
        "breed" TEXT NOT NULL,
        "gender" TEXT NOT NULL,
        "birthDate" TIMESTAMP NOT NULL,
        "weight" DOUBLE PRECISION NOT NULL,
        "status" TEXT DEFAULT 'healthy',
        "color" TEXT,
        "penNumber" TEXT,
        "notes" TEXT,
        "purchasePrice" DOUBLE PRECISION,
        "purchaseDate" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "HealthRecord" (
        "id" TEXT PRIMARY KEY,
        "animalId" TEXT NOT NULL REFERENCES "Animal"("id") ON DELETE CASCADE,
        "date" TIMESTAMP DEFAULT NOW(),
        "type" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "veterinarian" TEXT,
        "medication" TEXT,
        "dosage" TEXT,
        "nextDueDate" TIMESTAMP,
        "cost" DOUBLE PRECISION,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BreedingRecord" (
        "id" TEXT PRIMARY KEY,
        "maleId" TEXT NOT NULL REFERENCES "Animal"("id"),
        "femaleId" TEXT NOT NULL REFERENCES "Animal"("id"),
        "breedingDate" TIMESTAMP NOT NULL,
        "expectedBirth" TIMESTAMP,
        "actualBirth" TIMESTAMP,
        "offspringCount" INTEGER,
        "status" TEXT DEFAULT 'planned',
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FeedingRecord" (
        "id" TEXT PRIMARY KEY,
        "animalId" TEXT REFERENCES "Animal"("id") ON DELETE CASCADE,
        "date" TIMESTAMP DEFAULT NOW(),
        "feedType" TEXT NOT NULL,
        "quantity" DOUBLE PRECISION NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Expense" (
        "id" TEXT PRIMARY KEY,
        "category" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "date" TIMESTAMP DEFAULT NOW(),
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Income" (
        "id" TEXT PRIMARY KEY,
        "category" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "amount" DOUBLE PRECISION NOT NULL,
        "date" TIMESTAMP DEFAULT NOW(),
        "notes" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT DEFAULT 'user',
        "phone" TEXT,
        "avatar" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "lastLogin" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        UNIQUE("provider", "providerAccountId")
      );
    `);
    
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT PRIMARY KEY,
        "sessionToken" TEXT UNIQUE NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "expires" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('All tables created successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'All database tables created successfully!' 
    });
    
  } catch (error: any) {
    console.error('Error creating tables:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
}
