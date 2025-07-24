import { NextRequest, NextResponse } from 'next/server';
import sequelize from '@/lib/database';
import HealthEntry from '@/models/HealthEntry';

// Initialize database connection
async function initDB() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// GET - Fetch all health entries
export async function GET() {
  try {
    await initDB();
    const entries = await HealthEntry.findAll({
      order: [['timestamp', 'DESC']],
    });
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching health entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health entries' },
      { status: 500 }
    );
  }
}

// POST - Create new health entry
export async function POST(request: NextRequest) {
  try {
    await initDB();
    const body = await request.json();
    
    const entry = await HealthEntry.create({
      id: body.id,
      type: body.type,
      value: body.value,
      systolic: body.systolic,
      diastolic: body.diastolic,
      arm: body.arm,
      timestamp: body.timestamp,
      note: body.note,
    });
    
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating health entry:', error);
    return NextResponse.json(
      { error: 'Failed to create health entry' },
      { status: 500 }
    );
  }
}

// PUT - Update health entry
export async function PUT(request: NextRequest) {
  try {
    await initDB();
    const body = await request.json();
    
    const entry = await HealthEntry.findByPk(body.id);
    if (!entry) {
      return NextResponse.json(
        { error: 'Health entry not found' },
        { status: 404 }
      );
    }
    
    await entry.update({
      type: body.type,
      value: body.value,
      systolic: body.systolic,
      diastolic: body.diastolic,
      arm: body.arm,
      timestamp: body.timestamp,
      note: body.note,
    });
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating health entry:', error);
    return NextResponse.json(
      { error: 'Failed to update health entry' },
      { status: 500 }
    );
  }
}

// DELETE - Delete health entry
export async function DELETE(request: NextRequest) {
  try {
    await initDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }
    
    const entry = await HealthEntry.findByPk(id);
    if (!entry) {
      return NextResponse.json(
        { error: 'Health entry not found' },
        { status: 404 }
      );
    }
    
    await entry.destroy();
    return NextResponse.json({ message: 'Health entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting health entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete health entry' },
      { status: 500 }
    );
  }
} 