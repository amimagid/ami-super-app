import { NextRequest, NextResponse } from 'next/server'
import sequelize from '@/lib/database'

// Define the Task model
const Task = sequelize.define('Task', {
  id: {
    type: 'VARCHAR(255)',
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: 'TEXT',
    allowNull: false,
  },
  completed: {
    type: 'BOOLEAN',
    allowNull: false,
    defaultValue: false,
  },
  weekStart: {
    type: 'DATE',
    allowNull: false,
  },
}, {
  tableName: 'my_tasks',
  timestamps: true,
  underscored: false,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

// GET - Fetch tasks for a specific week
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('weekStart')

    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart parameter is required' }, { status: 400 })
    }

    const tasks = await Task.findAll({
      where: { weekStart },
      order: [['created_at', 'ASC']],
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, weekStart } = body

    if (!title || !weekStart) {
      return NextResponse.json({ error: 'title and weekStart are required' }, { status: 400 })
    }

    const task = await Task.create({
      id: Date.now().toString(),
      title,
      weekStart,
      completed: false,
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
} 