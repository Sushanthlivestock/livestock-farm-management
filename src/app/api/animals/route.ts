import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all animals with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const gender = searchParams.get('gender');
    const search = searchParams.get('search');

    const where: any = {};
    
    if (type && type !== 'all') where.type = type;
    if (status && status !== 'all') where.status = status;
    if (gender && gender !== 'all') where.gender = gender;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tagNumber: { contains: search, mode: 'insensitive' } },
        { breed: { contains: search, mode: 'insensitive' } },
      ];
    }

    const animals = await db.animal.findMany({
      where,
      include: {
        healthRecords: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(animals);
  } catch (error) {
    console.error('Error fetching animals:', error);
    return NextResponse.json([]);
  }
}

// POST create new animal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('=== Creating Animal ===');
    console.log('Received data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const requiredFields = ['tagNumber', 'type', 'breed', 'gender', 'birthDate', 'weight'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
      }, { status: 400 });
    }
    
    // Prepare data
    const animalData = {
      tagNumber: String(body.tagNumber).trim(),
      name: body.name ? String(body.name).trim() : null,
      type: String(body.type),
      breed: String(body.breed),
      gender: String(body.gender),
      birthDate: new Date(body.birthDate),
      weight: parseFloat(body.weight) || 0,
      status: body.status || 'healthy',
      color: body.color ? String(body.color).trim() : null,
      penNumber: body.penNumber ? String(body.penNumber).trim() : null,
      notes: body.notes ? String(body.notes).trim() : null,
      purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
    };
    
    console.log('Prepared data for database:', JSON.stringify(animalData, null, 2));
    
    const animal = await db.animal.create({
      data: animalData,
    });

    console.log('Animal created successfully:', animal.id);
    return NextResponse.json(animal, { status: 201 });
    
  } catch (error: any) {
    console.error('=== Error Creating Animal ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    // Check for specific error types
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Tag number already exists. Please use a unique tag number.',
        code: 'DUPLICATE_TAG'
      }, { status: 400 });
    }
    
    if (error.code === 'P2021') {
      return NextResponse.json({ 
        error: 'Database table not found. Please run database migration.',
        code: 'TABLE_NOT_FOUND'
      }, { status: 500 });
    }
    
    if (error.code === 'P1001') {
      return NextResponse.json({ 
        error: 'Cannot connect to database. Please check DATABASE_URL.',
        code: 'DB_CONNECTION_ERROR'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create animal',
      details: error.message,
      code: error.code || 'UNKNOWN'
    }, { status: 500 });
  }
}
