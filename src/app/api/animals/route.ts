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
    
    if (type) where.type = type;
    if (status) where.status = status;
    if (gender) where.gender = gender;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { tagNumber: { contains: search } },
        { breed: { contains: search } },
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
    return NextResponse.json({ error: 'Failed to fetch animals' }, { status: 500 });
  }
}

// POST create new animal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const animal = await db.animal.create({
      data: {
        tagNumber: body.tagNumber,
        name: body.name,
        type: body.type,
        breed: body.breed,
        gender: body.gender,
        birthDate: new Date(body.birthDate),
        weight: parseFloat(body.weight),
        status: body.status || 'healthy',
        color: body.color,
        penNumber: body.penNumber,
        notes: body.notes,
        purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      },
    });

    return NextResponse.json(animal, { status: 201 });
  } catch (error) {
    console.error('Error creating animal:', error);
    return NextResponse.json({ error: 'Failed to create animal' }, { status: 500 });
  }
}
