import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all expenses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = {};
    if (category) where.category = category;

    const records = await db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json([]);
  }
}

// POST create expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const record = await db.expense.create({
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
    console.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
