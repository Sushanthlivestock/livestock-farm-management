import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all health records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const animalId = searchParams.get('animalId');
    const type = searchParams.get('type');

    const where: any = {};
    if (animalId) where.animalId = animalId;
    if (type) where.type = type;

    const records = await db.healthRecord.findMany({
      where,
      include: {
        animal: {
          select: {
            name: true,
            tagNumber: true,
            type: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching health records:', error);
    return NextResponse.json([]);
  }
}

// POST create health record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const record = await db.healthRecord.create({
      data: {
        animalId: body.animalId,
        date: new Date(body.date),
        type: body.type,
        description: body.description,
        veterinarian: body.veterinarian,
        medication: body.medication,
        dosage: body.dosage,
        nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
        cost: body.cost ? parseFloat(body.cost) : null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating health record:', error);
    return NextResponse.json({ error: 'Failed to create health record' }, { status: 500 });
  }
}
