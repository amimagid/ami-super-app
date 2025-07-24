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

// PUT - Update a health entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initDB()
    const body = await request.json()
    
    const entry = await HealthEntry.findByPk(params.id)
    if (!entry) {
      return NextResponse.json(
        { error: 'Health entry not found' },
        { status: 404 }
      )
    }
    
    await entry.update(body)
    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating health entry:', error)
    return NextResponse.json(
      { error: 'Failed to update health entry' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a health entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initDB()
    
    const entry = await HealthEntry.findByPk(params.id)
    if (!entry) {
      return NextResponse.json(
        { error: 'Health entry not found' },
        { status: 404 }
      )
    }
    
    await entry.destroy()
    return NextResponse.json({ message: 'Health entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting health entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete health entry' },
      { status: 500 }
    )
  }
} 