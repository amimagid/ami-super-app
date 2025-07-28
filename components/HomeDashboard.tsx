'use client'

import { useState, useEffect } from 'react'
import { Heart, Briefcase, CheckSquare, Calendar, Users, AlertTriangle, Scale, Dumbbell } from 'lucide-react'
import { format, startOfWeek, parseISO, startOfDay, endOfDay, startOfWeek as startOfWeekFn, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

interface HealthEntry {
  id: string
  date: string
  weight: number | null
  bpAMRight: string | null
  bpAMLeft: string | null
  bpAMTime: string | null
  bpAMNotes: string | null
  bpPMRight: string | null
  bpPMLeft: string | null
  bpPMTime: string | null
  bpPMNotes: string | null
  workout: string | null
}

interface WorkSummary {
  domains: Array<{
    id: string
    name: string
    memberCount: number
    statusCount: number
    currentWeekProjects: string[]
  }>
}

interface TaskSummary {
  workTasks: Array<{
    id: string
    title: string
    completed: boolean
    deadline?: string
  }>
  privateTasks: Array<{
    id: string
    title: string
    completed: boolean
    deadline?: string
  }>
}

export default function HomeDashboard({ onNavigate }: { onNavigate: (app: 'home' | 'health' | 'work' | 'tasks') => void }) {
  const [healthEntries, setHealthEntries] = useState<HealthEntry[]>([])
  const [workData, setWorkData] = useState<WorkSummary>({ domains: [] })
  const [taskData, setTaskData] = useState<TaskSummary>({ workTasks: [], privateTasks: [] })
  const [loading, setLoading] = useState(true)

  // Get today's date for tasks
  const today = new Date()
  const todayKey = format(today, 'yyyy-MM-dd')

  // Parse BP function (same as Health Log)
  const parseBP = (bpString: string | null) => {
    if (!bpString) return null
    const match = bpString.match(/(\d+)\/(\d+)/)
    return match ? [parseInt(match[1]), parseInt(match[2])] : null
  }

  // Get average BP from right and left readings
  const getAverageBP = (rightBP: string | null, leftBP: string | null) => {
    const right = parseBP(rightBP)
    const left = parseBP(leftBP)
    
    if (!right && !left) return null
    if (!right) return left
    if (!left) return right
    
    // Average the readings
    const avgSystolic = Math.round((right[0] + left[0]) / 2)
    const avgDiastolic = Math.round((right[1] + left[1]) / 2)
    
    return [avgSystolic, avgDiastolic]
  }

  // Calculate BP averages (same as Health Log)
  const calculateBPAverages = () => {
    const now = new Date()
    const today = startOfDay(now)
    const weekStart = startOfWeekFn(now, { weekStartsOn: 1 }) // Monday
    const monthStart = startOfMonth(now)

    const dailyEntries = healthEntries.filter(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate >= today
    })

    const weeklyEntries = healthEntries.filter(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate >= weekStart
    })

    const monthlyEntries = healthEntries.filter(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate >= monthStart
    })

    const calculateAverage = (entries: HealthEntry[]) => {
      let totalSystolic = 0
      let totalDiastolic = 0
      let count = 0

      entries.forEach(entry => {
        // Get average BP for AM and PM readings (right + left averaged)
        const amBP = getAverageBP(entry.bpAMRight, entry.bpAMLeft)
        const pmBP = getAverageBP(entry.bpPMRight, entry.bpPMLeft)
        
        // Use PM if available, otherwise AM
        const reading = pmBP || amBP
        
        if (reading) {
          totalSystolic += reading[0]
          totalDiastolic += reading[1]
          count++
        }
      })

      return count > 0 ? {
        systolic: Math.round(totalSystolic / count),
        diastolic: Math.round(totalDiastolic / count)
      } : null
    }

    return {
      daily: calculateAverage(dailyEntries),
      weekly: calculateAverage(weeklyEntries),
      monthly: calculateAverage(monthlyEntries)
    }
  }

  // Load health data
  const loadHealthData = async () => {
    try {
      const response = await fetch('/api/health-entries')
      if (response.ok) {
        const data = await response.json()
        setHealthEntries(data)
      }
    } catch (error) {
      console.error('Error loading health data:', error)
    }
  }

  // Load work status data
  const loadWorkData = async () => {
    try {
      const response = await fetch('/api/work-status')
      if (response.ok) {
        const data = await response.json()
        const domains = data.map((domain: any) => {
          // Get current week's projects from all members
          const currentWeekProjects = domain.members
            .flatMap((member: any) => 
              member.weeklyStatuses
                .filter((status: any) => status.currentWeek && status.currentWeek.trim())
                .map((status: any) => status.currentWeek.trim())
            )
            .filter((project: string, index: number, arr: string[]) => 
              arr.indexOf(project) === index // Remove duplicates
            )
            .slice(0, 3) // Limit to 3 projects per domain
          
          return {
            id: domain.id,
            name: domain.name,
            memberCount: domain.members.length,
            statusCount: domain.members.filter((member: any) => 
              member.weeklyStatuses.some((status: any) => status.currentWeek || status.nextWeek)
            ).length,
            currentWeekProjects
          }
        })
        setWorkData({ domains })
      }
    } catch (error) {
      console.error('Error loading work data:', error)
    }
  }

  // Load today's tasks
  const loadTaskData = async () => {
    try {
      const [workResponse, privateResponse] = await Promise.all([
        fetch(`/api/my-tasks?weekStart=${todayKey}&taskType=work`),
        fetch(`/api/my-tasks?weekStart=${todayKey}&taskType=private`)
      ])

      const workTasks = workResponse.ok ? await workResponse.json() : []
      const privateTasks = privateResponse.ok ? await privateResponse.json() : []

      setTaskData({ workTasks, privateTasks })
    } catch (error) {
      console.error('Error loading task data:', error)
    }
  }

  // Toggle task completion
  const toggleTask = async (taskId: string, taskType: 'work' | 'private') => {
    try {
      const response = await fetch(`/api/my-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !taskData[taskType === 'work' ? 'workTasks' : 'privateTasks'].find(t => t.id === taskId)?.completed
        }),
      })

      if (response.ok) {
        // Reload tasks to get updated data
        await loadTaskData()
      }
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  // Get most recent workout with date context
  const getRecentWorkout = () => {
    if (healthEntries.length === 0) return null
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    const todayEntry = healthEntries.find(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate.toDateString() === today.toDateString()
    })
    
    const yesterdayEntry = healthEntries.find(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate.toDateString() === yesterday.toDateString()
    })
    
    if (todayEntry?.workout) {
      return { workout: todayEntry.workout, date: 'Today', entryDate: todayEntry.date }
    } else if (yesterdayEntry?.workout) {
      return { workout: yesterdayEntry.workout, date: 'Yesterday', entryDate: yesterdayEntry.date }
    }
    
    return null
  }

  // Get most recent weight with date context
  const getRecentWeight = () => {
    if (healthEntries.length === 0) return null
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    const todayEntry = healthEntries.find(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate.toDateString() === today.toDateString()
    })
    
    const yesterdayEntry = healthEntries.find(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate.toDateString() === yesterday.toDateString()
    })
    
    if (todayEntry?.weight) {
      return { weight: todayEntry.weight, date: 'Today', entryDate: todayEntry.date }
    } else if (yesterdayEntry?.weight) {
      return { weight: yesterdayEntry.weight, date: 'Yesterday', entryDate: yesterdayEntry.date }
    }
    
    // Fallback to most recent entry
    const mostRecent = healthEntries[0]
    if (mostRecent?.weight) {
      const entryDate = parseISO(mostRecent.date)
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
      let dateLabel = ''
      if (daysDiff === 0) dateLabel = 'Today'
      else if (daysDiff === 1) dateLabel = 'Yesterday'
      else if (daysDiff <= 7) dateLabel = `${daysDiff} days ago`
      else dateLabel = format(entryDate, 'MMM d')
      
      return { weight: mostRecent.weight, date: dateLabel, entryDate: mostRecent.date }
    }
    
    return null
  }

  // Get most recent BP with date context
  const getRecentBP = () => {
    if (healthEntries.length === 0) return null
    
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    const todayEntry = healthEntries.find(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate.toDateString() === today.toDateString()
    })
    
    const yesterdayEntry = healthEntries.find(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate.toDateString() === yesterday.toDateString()
    })
    
    const getBPFromEntry = (entry: HealthEntry) => {
      // Get average BP for AM and PM readings (right + left averaged)
      const amBP = getAverageBP(entry.bpAMRight, entry.bpAMLeft)
      const pmBP = getAverageBP(entry.bpPMRight, entry.bpPMLeft)
      
      // Return the most recent reading (PM over AM)
      return pmBP || amBP
    }
    
    if (todayEntry) {
      const bp = getBPFromEntry(todayEntry)
      if (bp) return { bp: `${bp[0]}/${bp[1]}`, date: 'Today', entryDate: todayEntry.date }
    }
    
    if (yesterdayEntry) {
      const bp = getBPFromEntry(yesterdayEntry)
      if (bp) return { bp: `${bp[0]}/${bp[1]}`, date: 'Yesterday', entryDate: yesterdayEntry.date }
    }
    
    // Fallback to most recent entry with BP
    for (const entry of healthEntries) {
      const bp = getBPFromEntry(entry)
      if (bp) {
        const entryDate = parseISO(entry.date)
        const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24))
        let dateLabel = ''
        if (daysDiff === 0) dateLabel = 'Today'
        else if (daysDiff === 1) dateLabel = 'Yesterday'
        else if (daysDiff <= 7) dateLabel = `${daysDiff} days ago`
        else dateLabel = format(entryDate, 'MMM d')
        
        return { bp: `${bp[0]}/${bp[1]}`, date: dateLabel, entryDate: entry.date }
      }
    }
    
    return null
  }

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      try {
        await Promise.all([loadHealthData(), loadWorkData(), loadTaskData()])
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Your Super App
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Loading your dashboard...
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }



  return (
    <div className="animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Your Super App
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Here's a quick overview of your data
        </p>
      </div>
      
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Health Summary - Using same widgets as Health Log */}
        {healthEntries.length > 0 && (
          <div className="card cursor-pointer hover:shadow-xl transition-shadow duration-300" onClick={() => onNavigate('health')}>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Weight Widget */}
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Scale className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    {(() => {
                      const recentWeight = getRecentWeight()
                      return (
                        <>
                          <p className="text-2xl font-bold text-gray-900">
                            {recentWeight ? `${recentWeight.weight} kg` : 'N/A'}
                          </p>
                          {recentWeight && (
                            <p className="text-xs text-gray-500">
                              {recentWeight.date}
                            </p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Recent BP Widget */}
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Heart className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">BP</p>
                    {(() => {
                      const recentBP = getRecentBP()
                      return (
                        <>
                          <p className="text-2xl font-bold text-gray-900">
                            {recentBP ? recentBP.bp : 'N/A'}
                          </p>
                          {recentBP && (
                            <p className="text-xs text-gray-500">
                              {recentBP.date}
                            </p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* Workout Widget */}
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Dumbbell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Workout</p>
                    {(() => {
                      const recentWorkout = getRecentWorkout()
                      return (
                        <>
                          <p className="text-lg font-bold text-gray-900 truncate">
                            {recentWorkout ? recentWorkout.workout : 'No workout'}
                          </p>
                          {recentWorkout && (
                            <p className="text-xs text-gray-500">
                              {recentWorkout.date}
                            </p>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Summary */}
        <div className="card cursor-pointer hover:shadow-xl transition-shadow duration-300" onClick={() => onNavigate('tasks')}>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Work Tasks */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Briefcase size={16} className="mr-2" />
                Work Tasks ({taskData.workTasks.filter(t => !t.completed).length} pending)
              </h4>
              <div className="space-y-2">
                {taskData.workTasks
                  .filter(task => !task.completed)
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTask(task.id, 'work')
                        }}
                        className="w-3 h-3 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                      ></button>
                      <span className="text-sm text-gray-900">
                        {task.title}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.deadline), 'MMM d')}
                        </span>
                      )}
                    </div>
                  ))}
                {taskData.workTasks.filter(t => !t.completed).length === 0 && (
                  <p className="text-sm text-gray-500">No pending work tasks for today</p>
                )}
              </div>
            </div>

            {/* Private Tasks */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar size={16} className="mr-2" />
                Private Tasks ({taskData.privateTasks.filter(t => !t.completed).length} pending)
              </h4>
              <div className="space-y-2">
                {taskData.privateTasks
                  .filter(task => !task.completed)
                  .slice(0, 2)
                  .map(task => (
                    <div key={task.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTask(task.id, 'private')
                        }}
                        className="w-3 h-3 rounded-full bg-gray-300 hover:bg-gray-400 transition-colors"
                      ></button>
                      <span className="text-sm text-gray-900">
                        {task.title}
                      </span>
                      {task.deadline && (
                        <span className="text-xs text-gray-500">
                          {format(new Date(task.deadline), 'MMM d')}
                        </span>
                      )}
                    </div>
                  ))}
                {taskData.privateTasks.filter(t => !t.completed).length === 0 && (
                  <p className="text-sm text-gray-500">No pending private tasks for today</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Work Status Summary */}
        <div className="card cursor-pointer hover:shadow-xl transition-shadow duration-300" onClick={() => onNavigate('work')}>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {workData.domains.map(domain => (
              <div key={domain.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900 mb-3 text-center">{domain.name}</div>
                {domain.currentWeekProjects.length > 0 && (
                  <div className="space-y-1">
                    {domain.currentWeekProjects.map((project, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-white p-1 rounded">
                        {project.length > 30 ? project.substring(0, 30) + '...' : project}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 