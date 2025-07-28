'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Circle, 
  ChevronLeft, 
  ChevronRight,
  Edit3,
  X
} from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns'

interface Task {
  id: string
  title: string
  completed: boolean
  weekStart: string
  deadline?: string
  taskType: string
  createdAt: string
  updatedAt: string
}

export default function MyTasks() {
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'work' | 'private'>('work')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDeadline, setNewTaskDeadline] = useState('')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDeadline, setEditingDeadline] = useState('')

  // Get week range for display
  const getWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 0 }) // Sunday
    const end = endOfWeek(date, { weekStartsOn: 0 })
    
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      display: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    }
  }

  const weekRange = getWeekRange(selectedWeek)
  const currentWeekKey = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd')
  const selectedWeekKey = format(startOfWeek(selectedWeek, { weekStartsOn: 0 }), 'yyyy-MM-dd')

  // Load tasks for the selected week
  const loadTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/my-tasks?weekStart=${selectedWeekKey}&taskType=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      } else {
        console.error('Failed to load tasks')
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add new task
  const addTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const response = await fetch('/api/my-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          weekStart: selectedWeekKey,
          deadline: newTaskDeadline || undefined,
          taskType: activeTab,
        }),
      })

      if (response.ok) {
        const newTask = await response.json()
        setTasks(prev => [...prev, newTask])
        setNewTaskTitle('')
        setNewTaskDeadline('')
      } else {
        console.error('Failed to add task')
      }
    } catch (error) {
      console.error('Error adding task:', error)
    }
  }

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const response = await fetch(`/api/my-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      })

      if (response.ok) {
        setTasks(prev => 
          prev.map(t => 
            t.id === taskId 
              ? { ...t, completed: !t.completed }
              : t
          )
        )
      } else {
        console.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  // Update task title and deadline
  const updateTask = async () => {
    if (!editingTask || !editingTitle.trim()) return

    try {
      const response = await fetch(`/api/my-tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingTitle.trim(),
          deadline: editingDeadline || undefined,
        }),
      })

      if (response.ok) {
        setTasks(prev => 
          prev.map(t => 
            t.id === editingTask.id 
              ? { ...t, title: editingTitle.trim(), deadline: editingDeadline || undefined }
              : t
          )
        )
        setEditingTask(null)
        setEditingTitle('')
        setEditingDeadline('')
      } else {
        console.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/my-tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
      } else {
        console.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  // Load tasks when week or tab changes
  useEffect(() => {
    loadTasks()
  }, [selectedWeek, activeTab])

  // Helper function to check if deadline has passed
  const isDeadlinePassed = (deadline: string) => {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return deadlineDate < today
  }

  const completedTasks = tasks.filter(task => task.completed)
  const pendingTasks = tasks.filter(task => !task.completed)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
        <p className="text-gray-600">Manage your weekly tasks and goals</p>
      </div>

      {/* Week Navigation */}
      <div className="card mb-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedWeek(subWeeks(selectedWeek, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center space-x-4">
            <Calendar size={20} className="text-gray-600" />
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {weekRange.display}
              </h3>
              {currentWeekKey === selectedWeekKey && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Current Week
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
            
            <button
              onClick={() => setSelectedWeek(new Date())}
              disabled={currentWeekKey === selectedWeekKey}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors h-10 ${
                currentWeekKey === selectedWeekKey
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Calendar size={16} />
              <span>Go to Current Week</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Type Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('work')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'work'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>Work Tasks</span>
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === 'private'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>Private Tasks</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Add New Task */}
      <div className="card mb-6">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTask()
              }
            }}
            placeholder="Add a new task..."
            className="input-field flex-1"
          />
          <input
            type="date"
            value={newTaskDeadline}
            onChange={(e) => setNewTaskDeadline(e.target.value)}
            className="input-field w-48"
            placeholder="Deadline (optional)"
          />
          <button
            onClick={addTask}
            disabled={!newTaskTitle.trim()}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-6">
        {/* Pending Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Tasks ({pendingTasks.length})
            </h3>
            <div className="text-xs text-gray-500 flex items-center space-x-1">
              <span>Ordered by deadline</span>
              <span className="text-blue-500">↑</span>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading tasks...</p>
            </div>
          ) : pendingTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Circle size={48} className="mx-auto mb-2 text-gray-300" />
              <p>No pending tasks for this week</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(task => (
                <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="text-gray-400 hover:text-green-600 transition-colors"
                  >
                    <Circle size={20} />
                  </button>
                  
                  {editingTask?.id === task.id ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateTask()
                          }
                          if (e.key === 'Escape') {
                            setEditingTask(null)
                            setEditingTitle('')
                            setEditingDeadline('')
                          }
                        }}
                        className="input-field flex-1"
                        autoFocus
                      />
                      <input
                        type="date"
                        value={editingDeadline}
                        onChange={(e) => setEditingDeadline(e.target.value)}
                        className="input-field w-40"
                        placeholder="Deadline"
                      />
                      <button
                        onClick={updateTask}
                        className="p-1 text-green-600 hover:text-green-700"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTask(null)
                          setEditingTitle('')
                          setEditingDeadline('')
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className={`text-gray-900 ${task.deadline && isDeadlinePassed(task.deadline) ? 'text-red-600 font-medium' : ''}`}>
                          {task.title}
                        </span>
                        {task.deadline && (
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">Deadline:</span>
                            <span className={`text-xs ${isDeadlinePassed(task.deadline) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              {format(new Date(task.deadline), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingTask(task)
                            setEditingTitle(task.title)
                            setEditingDeadline(task.deadline || '')
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Completed Tasks ({completedTasks.length})
              </h3>
              <div className="text-xs text-gray-500 flex items-center space-x-1">
                <span>Click checkmark to reopen</span>
                <span className="text-blue-500">↑</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {completedTasks.map(task => (
                <div key={task.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="text-green-600 hover:text-green-700 transition-colors"
                    title="Click to reopen task"
                  >
                    <CheckCircle size={20} />
                  </button>
                  
                  <div className="flex-1">
                    <span className="text-gray-900 line-through">{task.title}</span>
                    {task.deadline && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">Deadline:</span>
                        <span className="text-xs text-gray-600 line-through">
                          {format(new Date(task.deadline), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingTask(task)
                        setEditingTitle(task.title)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 