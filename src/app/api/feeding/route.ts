import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all feeding records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const animalId = searchParams.get('animalId');

    const where: any = {};
    if (animalId) where.animalId = animalId;

    const records = await db.feedingRecord.findMany({
      where,
      include: {
        animal: {
          select: { name: true, tagNumber: true, type: true },
        },
      },
      orderBy: { date: 'desc' },
      take: 100,
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching feeding records:', error);
    return NextResponse.json([]);
  }
}

// POST create feeding record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If animalId is empty or not provided, set to null for general feeding record
    const animalId = body.animalId && body.animalId.trim() !== '' ? body.animalId : null;
    
    const record = await db.feedingRecord.create({
      data: {
        animalId: animalId,
        date: body.date ? new Date(body.date) : new Date(),
        feedType: body.feedType,
        quantity: parseFloat(body.quantity) || 0,
        notes: body.notes || null,
      },
      include: {
        animal: {
          select: { name: true, tagNumber: true, type: true },
        },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating feeding record:', error);
    return NextResponse.json({ error: 'Failed to create feeding record', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
