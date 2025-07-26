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

// PUT - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { title, completed } = body

    const task = await Task.findByPk(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update only the fields that are provided
    if (title !== undefined) {
      task.title = title
    }
    if (completed !== undefined) {
      task.completed = completed
    }

    await task.save()

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const task = await Task.findByPk(id)
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await task.destroy()

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
} 