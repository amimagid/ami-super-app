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

// POST - Upload CSV file and parse health data
export async function POST(request: NextRequest) {
  try {
    await initDB()
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read the CSV file
    const text = await file.text()
    const lines = text.split('\n')
    
    // Fix the header line that has a line break
    let headerLine = lines[0]
    if (lines[1] && lines[1].trim() === 'Workout') {
      headerLine = headerLine + ',Workout'
      lines.splice(1, 1) // Remove the separate Workout line
    }
    
    const headers = headerLine.split(',').map(h => h.trim())
    
    // Parse CSV data
    const entries = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Parse CSV line properly, handling quoted values
      const values: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Add the last value
      
      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || null
      })
      
      // Skip rows without a date
      if (!row['Date']) continue
      
      // Parse weight
      const weight = row['Weight (kg)'] ? parseFloat(row['Weight (kg)']) : null
      
      // Helper function to validate time format
      const isValidTime = (timeStr: string) => {
        if (!timeStr) return false
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr)
      }
      
      // Create health entry
      const entry = {
        id: Date.now().toString() + i,
        date: row['Date'],
        weight: weight,
        bpAMRight: row['BP AM Right'] || null,
        bpAMLeft: row['BP AM Left'] || null,
        bpAMTime: isValidTime(row['BP AM Time']) ? row['BP AM Time'] : null,
        bpAMNotes: row['BP AM Notes'] || null,
        bpPMRight: row['BP PM Right'] || null,
        bpPMLeft: row['BP PM Left'] || null,
        bpPMTime: isValidTime(row['BP PM Time']) ? row['BP PM Time'] : null,
        bpPMNotes: row['BP PM Notes'] || null,
        workout: row['Workout'] || null
      }
      
      entries.push(entry)
    }
    
    // Save entries to database
    for (const entry of entries) {
      await HealthEntry.create(entry)
    }
    
    return NextResponse.json({ 
      message: `Successfully uploaded ${entries.length} health entries`,
      count: entries.length 
    })
  } catch (error) {
    console.error('Error uploading health data:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to upload health data', details: error.message },
      { status: 500 }
    )
  }
} 