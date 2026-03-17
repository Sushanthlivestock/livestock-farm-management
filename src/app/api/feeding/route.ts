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
    return NextResponse.json({ error: 'Failed to fetch feeding records' }, { status: 500 });
  }
}

// POST create feeding record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const record = await db.feedingRecord.create({
      data: {
        animalId: body.animalId,
        date: new Date(body.date),
        feedType: body.feedType,
        quantity: parseFloat(body.quantity),
        notes: body.notes,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating feeding record:', error);
    return NextResponse.json({ error: 'Failed to create feeding record' }, { status: 500 });
  }
}
