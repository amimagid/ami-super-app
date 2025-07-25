'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Calendar, Activity, Scale, Heart, Clock, Edit3, Save, X, Plus, Mail, ChevronDown, ChevronRight } from 'lucide-react'
import { format, parseISO, subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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

export default function HealthLog() {
  const [entries, setEntries] = useState<HealthEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<Partial<HealthEntry>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null)
  const [bpTimeRange, setBpTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week')
  const [weightTimeRange, setWeightTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week')
  const [bpArmFilter, setBpArmFilter] = useState<'right' | 'left' | 'both'>('both')
  const [exportingEmail, setExportingEmail] = useState(false)
  const [chartsExpanded, setChartsExpanded] = useState(false)
  const [newEntry, setNewEntry] = useState<Partial<HealthEntry>>({
    date: new Date().toISOString().split('T')[0],
    weight: null,
    bpAMRight: null,
    bpAMLeft: null,
    bpAMTime: null,
    bpAMNotes: null,
    bpPMRight: null,
    bpPMLeft: null,
    bpPMTime: null,
    bpPMNotes: null,
    workout: null
  })

  useEffect(() => {
    loadHealthData()
  }, [])

  const loadHealthData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/health-log')
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      } else {
        console.error('Failed to load health data')
      }
    } catch (error) {
      console.error('Error loading health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/health-log/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await loadHealthData()
        alert('Health data uploaded successfully!')
      } else {
        throw new Error('Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const updateEntry = async (id: string, values: Partial<HealthEntry>) => {
    try {
      const response = await fetch(`/api/health-log/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        await loadHealthData()
        setEditingEntry(null)
        setEditingValues({})
      } else {
        throw new Error('Failed to update entry')
      }
    } catch (error) {
      console.error('Error updating entry:', error)
      alert('Failed to update entry. Please try again.')
    }
  }

  const confirmDelete = (id: string) => {
    setEntryToDelete(id)
    setShowDeleteModal(true)
  }

  const deleteEntry = async () => {
    if (!entryToDelete) return

    try {
      const response = await fetch(`/api/health-log/${entryToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadHealthData()
        setShowDeleteModal(false)
        setEntryToDelete(null)
      } else {
        throw new Error('Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry. Please try again.')
    }
  }

  const addEntry = async () => {
    if (!newEntry.date) {
      alert('Please select a date for the entry.')
      return
    }

    // Check if at least one field has data
    const hasData = newEntry.weight !== null || 
                   newEntry.bpAMRight || 
                   newEntry.bpAMLeft || 
                   newEntry.bpPMRight || 
                   newEntry.bpPMLeft || 
                   newEntry.workout

    if (!hasData) {
      alert('Please fill in at least one field (weight, blood pressure, or workout).')
      return
    }

    try {
      const response = await fetch('/api/health-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          ...newEntry
        }),
      })

      if (response.ok) {
        await loadHealthData()
        setShowAddModal(false)
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          weight: null,
          bpAMRight: null,
          bpAMLeft: null,
          bpAMTime: null,
          bpAMNotes: null,
          bpPMRight: null,
          bpPMLeft: null,
          bpPMTime: null,
          bpPMNotes: null,
          workout: null
        })
      } else {
        throw new Error('Failed to add entry')
      }
    } catch (error) {
      console.error('Error adding entry:', error)
      alert('Failed to add entry. Please try again.')
    }
  }

  const getBPStatus = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) return 'text-green-600'
    if (systolic < 130 && diastolic < 80) return 'text-yellow-600'
    if (systolic < 140 && diastolic < 90) return 'text-orange-600'
    return 'text-red-600'
  }

  const parseBP = (bpString: string | null) => {
    if (!bpString) return null
    const match = bpString.match(/(\d+)\/(\d+)/)
    return match ? [parseInt(match[1]), parseInt(match[2])] : null
  }

  // Calculate BP averages for different time periods
  const calculateBPAverages = () => {
    const now = new Date()
    const today = startOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
    const monthStart = startOfMonth(now)

    const dailyEntries = entries.filter(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate >= today
    })

    const weeklyEntries = entries.filter(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate >= weekStart
    })

    const monthlyEntries = entries.filter(entry => {
      const entryDate = parseISO(entry.date)
      return entryDate >= monthStart
    })

    const calculateAverage = (entries: HealthEntry[]) => {
      let totalSystolic = 0
      let totalDiastolic = 0
      let count = 0

      entries.forEach(entry => {
        const readings = [
          parseBP(entry.bpAMRight),
          parseBP(entry.bpAMLeft),
          parseBP(entry.bpPMRight),
          parseBP(entry.bpPMLeft)
        ].filter(Boolean)

        readings.forEach(([systolic, diastolic]) => {
          totalSystolic += systolic
          totalDiastolic += diastolic
          count++
        })
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

  // Prepare chart data for BP
  const getBPChartData = () => {
    const now = new Date()
    let filteredEntries = entries

    // Filter by time range
    switch (bpTimeRange) {
      case 'day':
        const today = startOfDay(now)
        filteredEntries = entries.filter(entry => {
          const entryDate = parseISO(entry.date)
          return entryDate >= today
        })
        break
      case 'week':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        filteredEntries = entries.filter(entry => {
          const entryDate = parseISO(entry.date)
          return entryDate >= weekStart
        })
        break
      case 'month':
        const monthStart = startOfMonth(now)
        filteredEntries = entries.filter(entry => {
          const entryDate = parseISO(entry.date)
          return entryDate >= monthStart
        })
        break
      case 'all':
        // Use all entries
        break
    }

    return filteredEntries
      .map(entry => {
        const data: any = {
          date: format(parseISO(entry.date), 'MMM dd'),
          fullDate: entry.date
        }

        if (bpArmFilter === 'right' || bpArmFilter === 'both') {
          const amRight = parseBP(entry.bpAMRight)
          const pmRight = parseBP(entry.bpPMRight)
          if (amRight) {
            data.systolicRightAM = amRight[0]
            data.diastolicRightAM = amRight[1]
          }
          if (pmRight) {
            data.systolicRightPM = pmRight[0]
            data.diastolicRightPM = pmRight[1]
          }
        }

        if (bpArmFilter === 'left' || bpArmFilter === 'both') {
          const amLeft = parseBP(entry.bpAMLeft)
          const pmLeft = parseBP(entry.bpPMLeft)
          if (amLeft) {
            data.systolicLeftAM = amLeft[0]
            data.diastolicLeftAM = amLeft[1]
          }
          if (pmLeft) {
            data.systolicLeftPM = pmLeft[0]
            data.diastolicLeftPM = pmLeft[1]
          }
        }

        return data
      })
      .filter(data => {
        // Only include entries that have BP data for the selected arm(s)
        if (bpArmFilter === 'right') {
          return data.systolicRightAM || data.systolicRightPM
        }
        if (bpArmFilter === 'left') {
          return data.systolicLeftAM || data.systolicLeftPM
        }
        return data.systolicRightAM || data.systolicRightPM || data.systolicLeftAM || data.systolicLeftPM
      })
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }

  // Prepare chart data for weight
  const getWeightChartData = () => {
    const now = new Date()
    let filteredEntries = entries

    // Filter by time range
    switch (weightTimeRange) {
      case 'day':
        const today = startOfDay(now)
        filteredEntries = entries.filter(entry => {
          const entryDate = parseISO(entry.date)
          return entryDate >= today
        })
        break
      case 'week':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        filteredEntries = entries.filter(entry => {
          const entryDate = parseISO(entry.date)
          return entryDate >= weekStart
        })
        break
      case 'month':
        const monthStart = startOfMonth(now)
        filteredEntries = entries.filter(entry => {
          const entryDate = parseISO(entry.date)
          return entryDate >= monthStart
        })
        break
      case 'all':
        // Use all entries
        break
    }

    return filteredEntries
      .filter(entry => entry.weight !== null)
      .map(entry => ({
        date: format(parseISO(entry.date), 'MMM dd'),
        weight: entry.weight
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Calculate interesting insights
  const calculateInsights = () => {
    if (entries.length === 0) return null

    const weightEntries = entries.filter(entry => entry.weight !== null)
    const bpEntries = entries.filter(entry => 
      entry.bpAMRight || entry.bpAMLeft || entry.bpPMRight || entry.bpPMLeft
    )
    const workoutEntries = entries.filter(entry => entry.workout)

    // Weight insights
    const weights = weightEntries.map(entry => entry.weight!)
    const weightChange = weights.length > 1 ? weights[0] - weights[weights.length - 1] : 0
    const weightTrend = weightChange > 0 ? 'Gained' : weightChange < 0 ? 'Lost' : 'Stable'
    const weightChangeAbs = Math.abs(weightChange)

    // BP insights
    const allBPReadings = []
    for (const entry of bpEntries) {
      if (entry.bpAMRight) allBPReadings.push(parseBP(entry.bpAMRight))
      if (entry.bpAMLeft) allBPReadings.push(parseBP(entry.bpAMLeft))
      if (entry.bpPMRight) allBPReadings.push(parseBP(entry.bpPMRight))
      if (entry.bpPMLeft) allBPReadings.push(parseBP(entry.bpPMLeft))
    }
    
    const validBPReadings = allBPReadings.filter(Boolean) as number[][]
    const highBPCount = validBPReadings.filter(([systolic, diastolic]) => 
      systolic >= 140 || diastolic >= 90
    ).length
    const bpHealthPercentage = validBPReadings.length > 0 
      ? Math.round(((validBPReadings.length - highBPCount) / validBPReadings.length) * 100)
      : 0

    // Workout insights
    const workoutTypes = workoutEntries.map(entry => entry.workout!.toLowerCase())
    const strengthCount = workoutTypes.filter(w => w.includes('strength')).length
    const cardioCount = workoutTypes.filter(w => 
      w.includes('run') || w.includes('jog') || w.includes('elliptical') || w.includes('hiit')
    ).length
    const skillCount = workoutTypes.filter(w => w.includes('skill')).length

    // Consistency insights
    const totalDays = entries.length
    const daysWithData = entries.filter(entry => 
      entry.weight !== null || entry.bpAMRight || entry.bpAMLeft || entry.bpPMRight || entry.bpPMLeft || entry.workout
    ).length
    const consistencyPercentage = Math.round((daysWithData / totalDays) * 100)

    return {
      weightChange,
      weightTrend,
      weightChangeAbs,
      bpHealthPercentage,
      highBPCount,
      totalBPReadings: validBPReadings.length,
      strengthCount,
      cardioCount,
      skillCount,
      consistencyPercentage,
      totalWorkouts: workoutEntries.length
    }
  }

  // Export to email function
  const exportToEmail = async () => {
    setExportingEmail(true)
    
    try {
      // Create a temporary div to render the PDF content
      const pdfContent = document.createElement('div')
      pdfContent.style.width = '800px'
      pdfContent.style.padding = '20px'
      pdfContent.style.backgroundColor = 'white'
      pdfContent.style.fontFamily = 'Arial, sans-serif'
      
      // Add title
      const title = document.createElement('h1')
      title.textContent = 'Health Log Report'
      title.style.textAlign = 'center'
      title.style.color = '#1f2937'
      title.style.marginBottom = '30px'
      pdfContent.appendChild(title)

      // Add summary
      const summary = document.createElement('div')
      summary.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">Summary</h3>
          <p style="margin: 5px 0;"><strong>Total Entries:</strong> ${entries.length}</p>
          <p style="margin: 5px 0;"><strong>Date Range:</strong> ${entries.length > 0 ? `${entries[entries.length - 1].date} to ${entries[0].date}` : 'No data'}</p>
          <p style="margin: 5px 0;"><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      `
      pdfContent.appendChild(summary)

      // Add BP averages
      const averages = calculateBPAverages()
      const bpAverages = document.createElement('div')
      bpAverages.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #374151; margin-bottom: 15px;">Blood Pressure Averages</h3>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="padding: 15px; background-color: #fef2f2; border-radius: 8px; text-align: center;">
              <h4 style="margin: 0 0 5px 0; color: #dc2626;">Daily Average</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold;">${averages.daily ? `${averages.daily.systolic}/${averages.daily.diastolic}` : 'N/A'}</p>
            </div>
            <div style="padding: 15px; background-color: #fffbeb; border-radius: 8px; text-align: center;">
              <h4 style="margin: 0 0 5px 0; color: #d97706;">Weekly Average</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold;">${averages.weekly ? `${averages.weekly.systolic}/${averages.weekly.diastolic}` : 'N/A'}</p>
            </div>
            <div style="padding: 15px; background-color: #f3e8ff; border-radius: 8px; text-align: center;">
              <h4 style="margin: 0 0 5px 0; color: #7c3aed;">Monthly Average</h4>
              <p style="margin: 0; font-size: 18px; font-weight: bold;">${averages.monthly ? `${averages.monthly.systolic}/${averages.monthly.diastolic}` : 'N/A'}</p>
            </div>
          </div>
        </div>
      `
      pdfContent.appendChild(bpAverages)

      // Add entries table
      if (entries.length > 0) {
        const entriesTable = document.createElement('div')
        entriesTable.innerHTML = `
          <div style="margin-bottom: 20px;">
            <h3 style="color: #374151; margin-bottom: 15px;">Health Entries</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Date</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Weight</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">BP AM</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">BP PM</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Workout</th>
                </tr>
              </thead>
              <tbody>
                ${entries.slice(0, 50).map(entry => `
                  <tr>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${entry.date}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${entry.weight || '-'}</td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">
                      ${entry.bpAMRight ? `R: ${entry.bpAMRight}` : ''}
                      ${entry.bpAMLeft ? `L: ${entry.bpAMLeft}` : ''}
                      ${!entry.bpAMRight && !entry.bpAMLeft ? '-' : ''}
                    </td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">
                      ${entry.bpPMRight ? `R: ${entry.bpPMRight}` : ''}
                      ${entry.bpPMLeft ? `L: ${entry.bpPMLeft}` : ''}
                      ${!entry.bpPMRight && !entry.bpPMLeft ? '-' : ''}
                    </td>
                    <td style="border: 1px solid #d1d5db; padding: 8px;">${entry.workout || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${entries.length > 50 ? `<p style="text-align: center; margin-top: 10px; color: #6b7280;">Showing first 50 entries of ${entries.length} total</p>` : ''}
          </div>
        `
        pdfContent.appendChild(entriesTable)
      }

      // Temporarily add to DOM to capture
      document.body.appendChild(pdfContent)
      
      // Capture as canvas
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      // Remove from DOM
      document.body.removeChild(pdfContent)
      
      // Convert to PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const pdfDataUrl = pdf.output('datauristring')

      // Send to email API
      const response = await fetch('/api/health-log/export-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfDataUrl,
          entries
        }),
      })

      if (response.ok) {
        alert('Health log report has been sent to amimagid@gmail.com!')
      } else {
        throw new Error('Failed to send email')
      }
    } catch (error) {
      console.error('Error exporting to email:', error)
      alert('Failed to send email. Please try again.')
    } finally {
      setExportingEmail(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading health data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Log</h1>
          <p className="text-gray-600">Track your daily health metrics and workouts</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Entry</span>
          </button>
          <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
            <Upload size={20} />
            <span>{uploading ? 'Uploading...' : 'Upload CSV'}</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {entries.length > 0 && (
            <button
              onClick={exportToEmail}
              disabled={exportingEmail}
              className="btn-secondary flex items-center space-x-2"
            >
              <Mail size={20} />
              <span>{exportingEmail ? 'Sending...' : 'Export to Email'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {entries.length > 0 && (
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Scale className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Weight</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {entries[0]?.weight ? `${entries[0].weight} kg` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Consolidated BP Averages Widget */}
            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                {(() => {
                  const averages = calculateBPAverages()
                  return (
                    <div className="grid grid-cols-3 gap-4 flex-1">
                      <div className="text-center">
                        <p className="text-xs text-red-600 font-medium">Daily</p>
                        <p className="text-lg font-bold text-gray-900">
                          {averages.daily ? `${averages.daily.systolic}/${averages.daily.diastolic}` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-orange-600 font-medium">Weekly</p>
                        <p className="text-lg font-bold text-gray-900">
                          {averages.weekly ? `${averages.weekly.systolic}/${averages.weekly.diastolic}` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-purple-600 font-medium">Monthly</p>
                        <p className="text-lg font-bold text-gray-900">
                          {averages.monthly ? `${averages.monthly.systolic}/${averages.monthly.diastolic}` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Health Insights Widget - Full Width */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Health Insights</p>
                <p className="text-lg font-semibold text-gray-900">Key Trends & Analytics</p>
              </div>
            </div>
            {(() => {
              const insights = calculateInsights()
              if (!insights) return <p className="text-gray-500 text-sm">No data available</p>
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weight Trend:</span>
                      <span className={`text-sm font-medium ${
                        insights.weightTrend === 'Lost' ? 'text-green-600' : 
                        insights.weightTrend === 'Gained' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {insights.weightTrend} {insights.weightChangeAbs > 0 ? `${insights.weightChangeAbs.toFixed(1)}kg` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total BP Readings:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {insights.totalBPReadings}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">BP Health Score:</span>
                      <span className={`text-sm font-medium ${
                        insights.bpHealthPercentage >= 80 ? 'text-green-600' : 
                        insights.bpHealthPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {insights.bpHealthPercentage}% healthy
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">High BP Readings:</span>
                      <span className="text-sm font-medium text-red-600">
                        {insights.highBPCount}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Workouts:</span>
                      <span className="text-sm font-medium text-blue-600">
                        {insights.totalWorkouts} sessions
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Strength Training:</span>
                      <span className="text-sm font-medium text-purple-600">
                        {insights.strengthCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cardio Sessions:</span>
                      <span className="text-sm font-medium text-orange-600">
                        {insights.cardioCount}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Data Consistency:</span>
                      <span className={`text-sm font-medium ${
                        insights.consistencyPercentage >= 80 ? 'text-green-600' : 
                        insights.consistencyPercentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {insights.consistencyPercentage}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Skill Training:</span>
                      <span className="text-sm font-medium text-indigo-600">
                        {insights.skillCount}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Charts */}
      {entries.length > 0 && (
        <div className="mb-8">
          {/* Charts Header */}
          <div className="card mb-4">
            <button
              onClick={() => setChartsExpanded(!chartsExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Analytics & Charts</h3>
                  <p className="text-sm text-gray-600">View detailed health trends and patterns</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {chartsExpanded ? 'Hide' : 'Show'} Charts
                </span>
                {chartsExpanded ? (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </button>
          </div>

          {/* Charts Content */}
          {chartsExpanded && (
            <div className="space-y-8">
              {/* Blood Pressure Chart */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    <span>Blood Pressure Trends</span>
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Time:</span>
                      <select
                        value={bpTimeRange}
                        onChange={(e) => setBpTimeRange(e.target.value as any)}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                      >
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Arm:</span>
                      <select
                        value={bpArmFilter}
                        onChange={(e) => setBpArmFilter(e.target.value as any)}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                      >
                        <option value="both">Both</option>
                        <option value="right">Right</option>
                        <option value="left">Left</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getBPChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[60, 'dataMax + 20']} />
                      <Tooltip />
                      <Legend />
                      {bpArmFilter === 'right' || bpArmFilter === 'both' ? (
                        <>
                          <Line type="monotone" dataKey="systolicRightAM" stroke="#ef4444" strokeWidth={2} name="Systolic Right AM" />
                          <Line type="monotone" dataKey="diastolicRightAM" stroke="#fca5a5" strokeWidth={2} name="Diastolic Right AM" />
                          <Line type="monotone" dataKey="systolicRightPM" stroke="#dc2626" strokeWidth={2} name="Systolic Right PM" />
                          <Line type="monotone" dataKey="diastolicRightPM" stroke="#fecaca" strokeWidth={2} name="Diastolic Right PM" />
                        </>
                      ) : null}
                      {bpArmFilter === 'left' || bpArmFilter === 'both' ? (
                        <>
                          <Line type="monotone" dataKey="systolicLeftAM" stroke="#3b82f6" strokeWidth={2} name="Systolic Left AM" />
                          <Line type="monotone" dataKey="diastolicLeftAM" stroke="#93c5fd" strokeWidth={2} name="Diastolic Left AM" />
                          <Line type="monotone" dataKey="systolicLeftPM" stroke="#1d4ed8" strokeWidth={2} name="Systolic Left PM" />
                          <Line type="monotone" dataKey="diastolicLeftPM" stroke="#bfdbfe" strokeWidth={2} name="Diastolic Left PM" />
                        </>
                      ) : null}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weight Chart */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <Scale className="h-5 w-5 text-green-600" />
                    <span>Weight Trends</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Time:</span>
                    <select
                      value={weightTimeRange}
                      onChange={(e) => setWeightTimeRange(e.target.value as any)}
                      className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                    >
                      <option value="day">Day</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getWeightChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[75, 90]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} name="Weight (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Health Entries */}
      {entries.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Data</h3>
          <p className="text-gray-600 mb-6">Upload a CSV file to start tracking your health metrics</p>
          <label className="btn-primary inline-flex items-center space-x-2 cursor-pointer">
            <Upload size={20} />
            <span>Upload CSV File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {format(parseISO(entry.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {entry.weight && (
                    <div className="flex items-center space-x-2">
                      <Scale className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{entry.weight} kg</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {editingEntry === entry.id ? (
                    <>
                      <button
                        onClick={() => updateEntry(entry.id, editingValues)}
                        className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingEntry(null)
                          setEditingValues({})
                        }}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingEntry(entry.id)
                          setEditingValues(entry)
                        }}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => confirmDelete(entry.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Morning Blood Pressure */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Morning Blood Pressure</span>
                  </h4>
                  {editingEntry === entry.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editingValues.bpAMRight || ''}
                          onChange={(e) => setEditingValues({...editingValues, bpAMRight: e.target.value})}
                          className="input-field"
                          placeholder="Right (e.g., 120/80)"
                        />
                        <input
                          type="text"
                          value={editingValues.bpAMLeft || ''}
                          onChange={(e) => setEditingValues({...editingValues, bpAMLeft: e.target.value})}
                          className="input-field"
                          placeholder="Left (e.g., 120/80)"
                        />
                      </div>
                      <input
                        type="time"
                        value={editingValues.bpAMTime || ''}
                        onChange={(e) => setEditingValues({...editingValues, bpAMTime: e.target.value})}
                        className="input-field"
                      />
                      <textarea
                        value={editingValues.bpAMNotes || ''}
                        onChange={(e) => setEditingValues({...editingValues, bpAMNotes: e.target.value})}
                        className="input-field"
                        rows={2}
                        placeholder="Notes..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        {entry.bpAMRight && (
                          <div className={`flex items-center space-x-2 ${getBPStatus(...parseBP(entry.bpAMRight) || [0, 0])}`}>
                            <Heart className="h-4 w-4" />
                            <span className="font-medium">Right: {entry.bpAMRight}</span>
                          </div>
                        )}
                        {entry.bpAMLeft && (
                          <div className={`flex items-center space-x-2 ${getBPStatus(...parseBP(entry.bpAMLeft) || [0, 0])}`}>
                            <Heart className="h-4 w-4" />
                            <span className="font-medium">Left: {entry.bpAMLeft}</span>
                          </div>
                        )}
                      </div>
                      {entry.bpAMTime && (
                        <p className="text-sm text-gray-600">Time: {entry.bpAMTime}</p>
                      )}
                      {entry.bpAMNotes && (
                        <p className="text-sm text-gray-600">{entry.bpAMNotes}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Evening Blood Pressure */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Evening Blood Pressure</span>
                  </h4>
                  {editingEntry === entry.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editingValues.bpPMRight || ''}
                          onChange={(e) => setEditingValues({...editingValues, bpPMRight: e.target.value})}
                          className="input-field"
                          placeholder="Right (e.g., 120/80)"
                        />
                        <input
                          type="text"
                          value={editingValues.bpPMLeft || ''}
                          onChange={(e) => setEditingValues({...editingValues, bpPMLeft: e.target.value})}
                          className="input-field"
                          placeholder="Left (e.g., 120/80)"
                        />
                      </div>
                      <input
                        type="time"
                        value={editingValues.bpPMTime || ''}
                        onChange={(e) => setEditingValues({...editingValues, bpPMTime: e.target.value})}
                        className="input-field"
                      />
                      <textarea
                        value={editingValues.bpPMNotes || ''}
                        onChange={(e) => setEditingValues({...editingValues, bpPMNotes: e.target.value})}
                        className="input-field"
                        rows={2}
                        placeholder="Notes..."
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-4">
                        {entry.bpPMRight && (
                          <div className={`flex items-center space-x-2 ${getBPStatus(...parseBP(entry.bpPMRight) || [0, 0])}`}>
                            <Heart className="h-4 w-4" />
                            <span className="font-medium">Right: {entry.bpPMRight}</span>
                          </div>
                        )}
                        {entry.bpPMLeft && (
                          <div className={`flex items-center space-x-2 ${getBPStatus(...parseBP(entry.bpPMLeft) || [0, 0])}`}>
                            <Heart className="h-4 w-4" />
                            <span className="font-medium">Left: {entry.bpPMLeft}</span>
                          </div>
                        )}
                      </div>
                      {entry.bpPMTime && (
                        <p className="text-sm text-gray-600">Time: {entry.bpPMTime}</p>
                      )}
                      {entry.bpPMNotes && (
                        <p className="text-sm text-gray-600">{entry.bpPMNotes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Workout */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Workout</span>
                </h4>
                {editingEntry === entry.id ? (
                  <input
                    type="text"
                    value={editingValues.workout || ''}
                    onChange={(e) => setEditingValues({...editingValues, workout: e.target.value})}
                    className="input-field"
                    placeholder="Workout type..."
                  />
                ) : (
                  <p className="text-gray-600">{entry.workout || 'No workout recorded'}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Health Entry</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Fill in any fields you want to track. You can add more data later by editing the entry.
            </p>

            <div className="space-y-6">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={newEntry.date || ''}
                  onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                  className="input-field"
                />
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Scale className="h-4 w-4" />
                  <span>Weight (kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newEntry.weight || ''}
                  onChange={(e) => setNewEntry({...newEntry, weight: e.target.value ? parseFloat(e.target.value) : null})}
                  className="input-field"
                  placeholder="Enter weight..."
                />
              </div>

              {/* Morning Blood Pressure */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Morning Blood Pressure</span>
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newEntry.bpAMRight || ''}
                      onChange={(e) => setNewEntry({...newEntry, bpAMRight: e.target.value})}
                      className="input-field"
                      placeholder="Right (e.g., 120/80)"
                    />
                    <input
                      type="text"
                      value={newEntry.bpAMLeft || ''}
                      onChange={(e) => setNewEntry({...newEntry, bpAMLeft: e.target.value})}
                      className="input-field"
                      placeholder="Left (e.g., 120/80)"
                    />
                  </div>
                  <input
                    type="time"
                    value={newEntry.bpAMTime || ''}
                    onChange={(e) => setNewEntry({...newEntry, bpAMTime: e.target.value})}
                    className="input-field"
                  />
                  <textarea
                    value={newEntry.bpAMNotes || ''}
                    onChange={(e) => setNewEntry({...newEntry, bpAMNotes: e.target.value})}
                    className="input-field"
                    rows={2}
                    placeholder="Notes..."
                  />
                </div>
              </div>

              {/* Evening Blood Pressure */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Evening Blood Pressure</span>
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newEntry.bpPMRight || ''}
                      onChange={(e) => setNewEntry({...newEntry, bpPMRight: e.target.value})}
                      className="input-field"
                      placeholder="Right (e.g., 120/80)"
                    />
                    <input
                      type="text"
                      value={newEntry.bpPMLeft || ''}
                      onChange={(e) => setNewEntry({...newEntry, bpPMLeft: e.target.value})}
                      className="input-field"
                      placeholder="Left (e.g., 120/80)"
                    />
                  </div>
                  <input
                    type="time"
                    value={newEntry.bpPMTime || ''}
                    onChange={(e) => setNewEntry({...newEntry, bpPMTime: e.target.value})}
                    className="input-field"
                  />
                  <textarea
                    value={newEntry.bpPMNotes || ''}
                    onChange={(e) => setNewEntry({...newEntry, bpPMNotes: e.target.value})}
                    className="input-field"
                    rows={2}
                    placeholder="Notes..."
                  />
                </div>
              </div>

              {/* Workout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Activity className="h-4 w-4" />
                  <span>Workout</span>
                </label>
                <input
                  type="text"
                  value={newEntry.workout || ''}
                  onChange={(e) => setNewEntry({...newEntry, workout: e.target.value})}
                  className="input-field"
                  placeholder="Workout type..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={addEntry}
                className="btn-primary"
              >
                Add Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delete Entry</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setEntryToDelete(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this health entry? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setEntryToDelete(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={deleteEntry}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 