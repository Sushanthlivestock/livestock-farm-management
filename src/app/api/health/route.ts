import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { LIMITS, checkDate, checkNumber, firstError } from '@/lib/validate';
import { db } from '@/lib/db';

// GET all health records
export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

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
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const invalid = firstError(
      checkNumber(body.cost, 'Cost', 0, LIMITS.maxAmount),
      checkDate(body.date, 'Date'),
      checkDate(body.nextDueDate, 'Next due date', true),
    );
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    
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
