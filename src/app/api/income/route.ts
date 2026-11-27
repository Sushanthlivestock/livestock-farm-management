import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { LIMITS, checkDate, checkNumber, firstError } from '@/lib/validate';
import { db } from '@/lib/db';

// GET all income records
export async function GET(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) where.category = category;

    const records = await db.income.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching income records:', error);
    return NextResponse.json([]);
  }
}

// POST create income record
export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const invalid = firstError(
      body.amount === undefined || body.amount === '' ? 'Amount is required' : null,
      checkNumber(body.amount, 'Amount', 0.01, LIMITS.maxAmount),
      checkDate(body.date, 'Date'),
    );
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    
    const record = await db.income.create({
      data: {
        category: body.category,
        description: body.description,
        amount: parseFloat(body.amount),
        date: new Date(body.date),
        notes: body.notes,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating income record:', error);
    return NextResponse.json({ error: 'Failed to create income record' }, { status: 500 });
  }
}
