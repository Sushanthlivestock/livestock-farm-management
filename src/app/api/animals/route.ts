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
    
    console.log('Creating animal with data:', body);
    
    // Validate required fields
    if (!body.tagNumber || !body.type || !body.breed || !body.gender || !body.birthDate || !body.weight) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['tagNumber', 'type', 'breed', 'gender', 'birthDate', 'weight']
      }, { status: 400 });
    }
    
    const animal = await db.animal.create({
      data: {
        tagNumber: body.tagNumber,
        name: body.name || null,
        type: body.type,
        breed: body.breed,
        gender: body.gender,
        birthDate: new Date(body.birthDate),
        weight: parseFloat(body.weight) || 0,
        status: body.status || 'healthy',
        color: body.color || null,
        penNumber: body.penNumber || null,
        notes: body.notes || null,
        purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      },
    });

    console.log('Animal created successfully:', animal);
    return NextResponse.json(animal, { status: 201 });
  } catch (error: any) {
    console.error('Error creating animal:', error);
    
    // Check for unique constraint violation (duplicate tag number)
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'Tag number already exists. Please use a unique tag number.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create animal',
      details: error.message 
    }, { status: 500 });
  }
}
