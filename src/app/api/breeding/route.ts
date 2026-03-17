import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all breeding records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const records = await db.breedingRecord.findMany({
      where,
      include: {
        male: {
          select: { id: true, name: true, tagNumber: true, type: true },
        },
        female: {
          select: { id: true, name: true, tagNumber: true, type: true },
        },
      },
      orderBy: { breedingDate: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching breeding records:', error);
    return NextResponse.json({ error: 'Failed to fetch breeding records' }, { status: 500 });
  }
}

// POST create breeding record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const record = await db.breedingRecord.create({
      data: {
        maleId: body.maleId,
        femaleId: body.femaleId,
        breedingDate: new Date(body.breedingDate),
        expectedBirth: body.expectedBirth ? new Date(body.expectedBirth) : null,
        status: body.status || 'planned',
        notes: body.notes,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating breeding record:', error);
    return NextResponse.json({ error: 'Failed to create breeding record' }, { status: 500 });
  }
}
