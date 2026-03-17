import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET single animal by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const animal = await db.animal.findUnique({
      where: { id },
      include: {
        healthRecords: {
          orderBy: { date: 'desc' },
        },
        feedingRecords: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        maleBreeding: {
          include: {
            female: true,
          },
        },
        femaleBreeding: {
          include: {
            male: true,
          },
        },
      },
    });

    if (!animal) {
      return NextResponse.json({ error: 'Animal not found' }, { status: 404 });
    }

    return NextResponse.json(animal);
  } catch (error) {
    console.error('Error fetching animal:', error);
    return NextResponse.json({ error: 'Failed to fetch animal' }, { status: 500 });
  }
}

// PUT update animal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: any = {};
    
    if (body.tagNumber !== undefined) updateData.tagNumber = body.tagNumber;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.breed !== undefined) updateData.breed = body.breed;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.birthDate !== undefined) updateData.birthDate = new Date(body.birthDate);
    if (body.weight !== undefined) updateData.weight = parseFloat(body.weight);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.penNumber !== undefined) updateData.penNumber = body.penNumber;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.purchasePrice !== undefined) updateData.purchasePrice = body.purchasePrice ? parseFloat(body.purchasePrice) : null;
    if (body.purchaseDate !== undefined) updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;

    const animal = await db.animal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(animal);
  } catch (error) {
    console.error('Error updating animal:', error);
    return NextResponse.json({ error: 'Failed to update animal' }, { status: 500 });
  }
}

// DELETE animal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await db.animal.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Animal deleted successfully' });
  } catch (error) {
    console.error('Error deleting animal:', error);
    return NextResponse.json({ error: 'Failed to delete animal' }, { status: 500 });
  }
}
