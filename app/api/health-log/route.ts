import { NextRequest, NextResponse } from 'next/server'
import sequelize from '@/lib/database'
import { HealthEntry } from '@/models/HealthEntry'
import { setupAssociations } from '@/lib/associations'

// Initialize database connection and associations
async function initDB() {
  try {
    await sequelize.authenticate();
    
    // Set up associations
    setupAssociations();
    
    await sequelize.sync({ force: false });
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// GET - Retrieve all health entries
export async function GET() {
  try {
    await initDB()
    
    const entries = await HealthEntry.findAll({
      order: [['date', 'DESC']]
    })
    
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching health entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health entries' },
      { status: 500 }
    )
  }
}

// POST - Create a new health entry
export async function POST(request: NextRequest) {
  try {
    await initDB()
    
    const body = await request.json()
    
    // Create the health entry
    const entry = await HealthEntry.create({
      id: body.id,
      date: body.date,
      weight: body.weight,
      bpAMRight: body.bpAMRight,
      bpAMLeft: body.bpAMLeft,
      bpAMTime: body.bpAMTime,
      bpAMNotes: body.bpAMNotes,
      bpPMRight: body.bpPMRight,
      bpPMLeft: body.bpPMLeft,
      bpPMTime: body.bpPMTime,
      bpPMNotes: body.bpPMNotes,
      workout: body.workout
    })
    
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating health entry:', error)
    return NextResponse.json(
      { error: 'Failed to create health entry' },
      { status: 500 }
    )
  }
} 