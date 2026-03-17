import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all breeding records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'all') where.status = status;

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
    return NextResponse.json([]);
  }
}

// POST create breeding record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Creating breeding record:', body);
    
    // Validate required fields
    if (!body.maleId || !body.femaleId || !body.breedingDate) {
      return NextResponse.json({ 
        error: 'Missing required fields: maleId, femaleId, breedingDate' 
      }, { status: 400 });
    }
    
    // Verify both animals exist
    const male = await db.animal.findUnique({ where: { id: body.maleId } });
    const female = await db.animal.findUnique({ where: { id: body.femaleId } });
    
    if (!male) {
      return NextResponse.json({ error: 'Male animal not found' }, { status: 400 });
    }
    if (!female) {
      return NextResponse.json({ error: 'Female animal not found' }, { status: 400 });
    }
    
    const record = await db.breedingRecord.create({
      data: {
        maleId: body.maleId,
        femaleId: body.femaleId,
        breedingDate: new Date(body.breedingDate),
        expectedBirth: body.expectedBirth ? new Date(body.expectedBirth) : null,
        status: body.status || 'planned',
        notes: body.notes || null,
      },
      include: {
        male: { select: { id: true, name: true, tagNumber: true, type: true } },
        female: { select: { id: true, name: true, tagNumber: true, type: true } },
      },
    });

    console.log('Breeding record created:', record);
    return NextResponse.json(record, { status: 201 });
  } catch (error: any) {
    console.error('Error creating breeding record:', error);
    return NextResponse.json({ 
      error: 'Failed to create breeding record',
      details: error.message 
    }, { status: 500 });
  }
}
