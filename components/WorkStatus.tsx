'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Users, 
  Shield, 
  AlertTriangle, 
  FileCheck, 
  Zap,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Save,
  X,
  UserPlus,
  MessageCircle,
  CheckCircle,
  FlaskConical
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'

interface TeamMember {
  id: string
  name: string
  email: string
  slackChannelId?: string
  weeklyStatuses: WeeklyStatus[]
}

interface WeeklyStatus {
  weekStart: string
  currentWeek: string
  nextWeek: string
  planned: string
}

interface Domain {
  id: string
  name: string
  iconName: string
  color: string
  bgColor: string
  members: TeamMember[]
}

export default function WorkStatus() {
  const [domains, setDomains] = useState<Domain[]>([
    {
      id: 'platform-security',
      name: 'Platform Security',
      iconName: 'shield',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      members: []
    },
    {
      id: 'threat-protection',
      name: 'Threat Protection',
      iconName: 'alert-triangle',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      members: []
    },
    {
      id: 'compliance',
      name: 'Compliance',
      iconName: 'file-check',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      members: []
    },
    {
      id: 'advanced-protection',
      name: 'Advanced Protection',
      iconName: 'zap',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      members: []
    },

    {
      id: 'rnd',
      name: 'R&D',
      iconName: 'flask-conical',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      members: []
    }
  ])
  
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingStatus, setEditingStatus] = useState<{
    domainId: string
    memberId: string
    field: 'currentWeek' | 'nextWeek' | 'planned'
  } | null>(null)
  const [showPlannedModal, setShowPlannedModal] = useState(false)
  const [editingPlannedData, setEditingPlannedData] = useState<{
    domainId: string
    memberId: string
    memberName: string
    weekStart: string
    weekDisplay: string
    planned: string
  } | null>(null)

  // Color coding for planned tasks
  const getPlannedTaskColor = (member: TeamMember, plannedContent: string) => {
    if (!plannedContent || plannedContent.trim() === '') return null
    
    // Get all planned tasks for this member across all weeks
    const allPlannedTasks = member.weeklyStatuses
      .map(status => status.planned)
      .filter(planned => planned && planned.trim() !== '')
    
    // Find unique planned tasks
    const uniquePlannedTasks = Array.from(new Set(allPlannedTasks))
    
    // Find the index of this planned task
    const taskIndex = uniquePlannedTasks.indexOf(plannedContent)
    
    if (taskIndex === -1) return null
    
    // Color palette for different tasks
    const colors = [
      'bg-orange-100 text-orange-800 border-orange-200',
      'bg-blue-100 text-blue-800 border-blue-200',
      'bg-green-100 text-green-800 border-green-200',
      'bg-purple-100 text-purple-800 border-purple-200',
      'bg-pink-100 text-pink-800 border-pink-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200'
    ]
    
    return colors[taskIndex % colors.length]
  }
  const [editingValues, setEditingValues] = useState<{
    currentWeek: string
    nextWeek: string
    planned: string
  }>({
    currentWeek: '',
    nextWeek: '',
    planned: ''
  })
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    domainId: '',
    slackChannelId: ''
  })
  const [editingMember, setEditingMember] = useState<{
    domainId: string
    memberId: string
  } | null>(null)
  const [editingMemberValues, setEditingMemberValues] = useState<{
    name: string
    email: string
    slackChannelId: string
  }>({
    name: '',
    email: '',
    slackChannelId: ''
  })
  const [showAddDomainModal, setShowAddDomainModal] = useState(false)
  const [newDomain, setNewDomain] = useState({
    name: '',
    iconName: 'shield',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  })

  const [showEditDomainModal, setShowEditDomainModal] = useState(false)
  const [editingDomain, setEditingDomain] = useState<{
    id: string
    name: string
    iconName: string
    color: string
    bgColor: string
  } | null>(null)
  const [editingDomainValues, setEditingDomainValues] = useState({
    name: '',
    iconName: 'shield',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  })

  const [showDeleteDomainModal, setShowDeleteDomainModal] = useState(false)
  const [deletingDomain, setDeletingDomain] = useState<{
    id: string
    name: string
    memberCount: number
  } | null>(null)

  const [activeTab, setActiveTab] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Load data from database on mount
  useEffect(() => {
    loadWorkStatus()
  }, [selectedWeek])

  const loadWorkStatus = async () => {
    try {
      setLoading(true)
      // Load all weekly statuses for the Gantt view
      const response = await fetch('/api/work-status')
      if (response.ok) {
        const data = await response.json()
        setDomains(data)
        // Set the first domain as active tab if no tab is selected
        if (data.length > 0 && !activeTab) {
          setActiveTab(data[0].id)
        }
      } else {
        console.error('Failed to load work status')
      }
    } catch (error) {
      console.error('Error loading work status:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeekRange = (date: Date) => {
    // Custom week calculation: Sunday to Thursday
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromSunday = dayOfWeek === 0 ? 0 : dayOfWeek // If it's Sunday, no days to subtract
    
    const start = new Date(date)
    start.setDate(date.getDate() - daysFromSunday)
    start.setHours(0, 0, 0, 0)
    
    const end = new Date(start)
    end.setDate(start.getDate() + 4) // Thursday is 4 days after Sunday
    end.setHours(23, 59, 59, 999)
    
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      display: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')} (Sun-Thu)`
    }
  }

  const getCurrentWeekKey = (date: Date) => {
    // Get the Sunday of the current week
    const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromSunday = dayOfWeek === 0 ? 0 : dayOfWeek
    
    const sunday = new Date(date)
    sunday.setDate(date.getDate() - daysFromSunday)
    sunday.setHours(0, 0, 0, 0)
    
    return format(sunday, 'yyyy-MM-dd')
  }

  const addMember = async () => {
    if (!newMember.name || !newMember.email || !newMember.domainId) return

    const member = {
      id: Date.now().toString(),
      name: newMember.name,
      email: newMember.email,
      domainId: newMember.domainId,
      slackChannelId: newMember.slackChannelId || null
    }

    try {
      const response = await fetch('/api/work-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(member),
      })
      
      if (response.ok) {
        await loadWorkStatus()
        setShowAddMemberModal(false)
        setNewMember({ name: '', email: '', domainId: '', slackChannelId: '' })
      } else {
        throw new Error('Failed to add member')
      }
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Failed to add member. Please try again.')
    }
  }

  const addDomain = async () => {
    if (!newDomain.name) return

    const domain = {
      id: newDomain.name.toLowerCase().replace(/\s+/g, '-'),
      name: newDomain.name,
      iconName: newDomain.iconName,
      color: newDomain.color,
      bgColor: newDomain.bgColor
    }

    try {
      const response = await fetch('/api/work-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...domain, type: 'domain' }),
      })
      
      if (response.ok) {
        await loadWorkStatus()
        setShowAddDomainModal(false)
        setNewDomain({ name: '', iconName: 'shield', color: 'text-blue-600', bgColor: 'bg-blue-100' })
      } else {
        throw new Error('Failed to add domain')
      }
    } catch (error) {
      console.error('Error adding domain:', error)
      alert('Failed to add domain. Please try again.')
    }
  }

  const editDomain = async () => {
    if (!editingDomain || !editingDomainValues.name) return

    const domain = {
      id: editingDomain.id,
      name: editingDomainValues.name,
      iconName: editingDomainValues.iconName,
      color: editingDomainValues.color,
      bgColor: editingDomainValues.bgColor
    }

    try {
      const response = await fetch('/api/work-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...domain, type: 'domain' }),
      })
      
      if (response.ok) {
        await loadWorkStatus()
        setShowEditDomainModal(false)
        setEditingDomain(null)
        setEditingDomainValues({ name: '', iconName: 'shield', color: 'text-blue-600', bgColor: 'bg-blue-100' })
      } else {
        throw new Error('Failed to update domain')
      }
    } catch (error) {
      console.error('Error updating domain:', error)
      alert('Failed to update domain. Please try again.')
    }
  }

  const deleteDomain = async () => {
    if (!deletingDomain) return

    try {
      const response = await fetch(`/api/work-status?domainId=${encodeURIComponent(deletingDomain.id)}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await loadWorkStatus()
        setShowDeleteDomainModal(false)
        setDeletingDomain(null)
        // If the deleted domain was active, switch to the first available domain
        if (activeTab === deletingDomain.id) {
          const remainingDomains = domains.filter(d => d.id !== deletingDomain.id)
          if (remainingDomains.length > 0) {
            setActiveTab(remainingDomains[0].id)
          }
        }
      } else {
        const errorData = await response.json()
        throw new Error(`Failed to delete domain: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting domain:', error)
      alert(`Failed to delete domain: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const openEditDomainModal = (domain: Domain) => {
    setEditingDomain(domain)
    setEditingDomainValues({
      name: domain.name,
      iconName: domain.iconName,
      color: domain.color,
      bgColor: domain.bgColor
    })
    setShowEditDomainModal(true)
  }

  const openDeleteDomainModal = (domain: Domain) => {
    setDeletingDomain({
      id: domain.id,
      name: domain.name,
      memberCount: domain.members.length
    })
    setShowDeleteDomainModal(true)
  }

  const removeMember = async (domainId: string, memberId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this team member? This will remove all their weekly status entries.')
    
    if (!confirmed) {
      return
    }
    
    try {
      const response = await fetch(`/api/work-status?memberId=${memberId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        await loadWorkStatus()
      } else {
        throw new Error('Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member. Please try again.')
    }
  }

  const getMemberStatus = (member: TeamMember, weekStart: string) => {
    return member.weeklyStatuses.find(status => status.weekStart === weekStart) || {
      weekStart,
      currentWeek: '',
      nextWeek: '',
      planned: ''
    }
  }



  const updateStatus = async (domainId: string, memberId: string, field: 'currentWeek' | 'nextWeek' | 'planned', value: string, specificWeekStart?: string) => {
    const weekStart = specificWeekStart || getCurrentWeekKey(selectedWeek)
    
    try {
      const response = await fetch('/api/work-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          weekStart,
          [field]: value
        }),
      })
      
      if (response.ok) {
        // Update local state instead of reloading all data
        setDomains(prevDomains => 
          prevDomains.map(domain => {
            if (domain.id === domainId) {
              return {
                ...domain,
                members: domain.members.map(member => {
                  if (member.id === memberId) {
                    const existingStatus = member.weeklyStatuses.find(status => status.weekStart === weekStart)
                    
                    if (existingStatus) {
                      // Update existing status
                      return {
                        ...member,
                        weeklyStatuses: member.weeklyStatuses.map(status => {
                          if (status.weekStart === weekStart) {
                            return {
                              ...status,
                              [field]: value
                            }
                          }
                          return status
                        })
                      }
                    } else {
                      // Create new status
                      const newStatus = {
                        weekStart,
                        currentWeek: '',
                        nextWeek: '',
                        planned: '',
                        [field]: value
                      }
                      return {
                        ...member,
                        weeklyStatuses: [...member.weeklyStatuses, newStatus]
                      }
                    }
                  }
                  return member
                })
              }
            }
            return domain
          })
        )
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status. Please try again.')
    }
  }

  const updateMember = async (domainId: string, memberId: string, values: { name: string; email: string; slackChannelId: string }) => {
    try {
      const response = await fetch('/api/work-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberId,
          name: values.name,
          email: values.email,
          slackChannelId: values.slackChannelId
        }),
      })
      
      if (response.ok) {
        await loadWorkStatus()
        setEditingMember(null)
        setEditingMemberValues({ name: '', email: '', slackChannelId: '' })
      } else {
        throw new Error('Failed to update member')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      alert('Failed to update member. Please try again.')
    }
  }

  const weekRange = getWeekRange(selectedWeek)
  const currentWeekKey = getCurrentWeekKey(selectedWeek)

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield':
        return <Shield size={24} />
      case 'alert-triangle':
        return <AlertTriangle size={24} />
      case 'file-check':
        return <FileCheck size={24} />
      case 'zap':
        return <Zap size={24} />
      case 'check-circle':
        return <CheckCircle size={24} />
      case 'flask-conical':
        return <FlaskConical size={24} />
      default:
        return <Shield size={24} />
    }
  }

  // Calculate total teammates and status completion
  const getStatusStats = () => {
    const weekStart = getCurrentWeekKey(selectedWeek)
    const totalTeammates = domains.reduce((total, domain) => total + domain.members.length, 0)
    
    let teammatesWithStatus = 0
    domains.forEach(domain => {
      domain.members.forEach(member => {
        const status = getMemberStatus(member, weekStart)
        if (status && (status.currentWeek || status.nextWeek)) {
          teammatesWithStatus++
        }
      })
    })
    
    const teammatesWithoutStatus = totalTeammates - teammatesWithStatus
    
    return {
      total: totalTeammates,
      withStatus: teammatesWithStatus,
      withoutStatus: teammatesWithoutStatus
    }
  }

  // Sort domains in the specified order
  const getSortedDomains = () => {
    const domainOrder = [
      'platform-security',    // Platform
      'advanced-protection',  // Advanced
      'rnd',                 // R&D Staff
      'threat-protection',    // Threat
      'compliance'           // Compliance
    ]
    
    return [...domains].sort((a, b) => {
      const aIndex = domainOrder.indexOf(a.id)
      const bIndex = domainOrder.indexOf(b.id)
      
      // If both domains are in the order list, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex
      }
      
      // If only one is in the order list, prioritize it
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      
      // If neither is in the order list, sort alphabetically
      return a.name.localeCompare(b.name)
    })
  }

  const getCurrentQuarter = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() // 0-11
    
    if (month >= 0 && month <= 2) return { year, quarter: 1 }
    if (month >= 3 && month <= 5) return { year, quarter: 2 }
    if (month >= 6 && month <= 8) return { year, quarter: 3 }
    return { year, quarter: 4 }
  }

  const getQuarterWeeks = () => {
    const { year, quarter } = getCurrentQuarter()
    const weeks = []
    
    // Calculate quarter start and end dates
    let quarterStart: Date
    let quarterEnd: Date
    
    if (quarter === 1) {
      quarterStart = new Date(year, 0, 1) // January 1
      quarterEnd = new Date(year, 2, 31) // March 31
    } else if (quarter === 2) {
      quarterStart = new Date(year, 3, 1) // April 1
      quarterEnd = new Date(year, 5, 30) // June 30
    } else if (quarter === 3) {
      quarterStart = new Date(year, 6, 1) // July 1
      quarterEnd = new Date(year, 8, 30) // September 30
    } else {
      quarterStart = new Date(year, 9, 1) // October 1
      quarterEnd = new Date(year, 11, 31) // December 31
    }
    
    // Generate weeks for the quarter (Sunday-Thursday)
    let currentDate = new Date(quarterStart)
    
    // Find the first Sunday of the quarter
    while (currentDate.getDay() !== 0) {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    while (currentDate <= quarterEnd) {
      const weekStart = new Date(currentDate)
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(currentDate.getDate() + 4) // Thursday
      
      weeks.push({
        start: format(weekStart, 'yyyy-MM-dd'),
        end: format(weekEnd, 'yyyy-MM-dd'),
        display: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
        isCurrentWeek: weekStart.getTime() === new Date(getCurrentWeekKey(new Date())).getTime()
      })
      
      // Move to next Sunday
      currentDate.setDate(currentDate.getDate() + 7)
    }
    
    return weeks
  }

  const getMemberStatusForWeek = (member: TeamMember, weekStart: string) => {
    return member.weeklyStatuses.find(status => status.weekStart === weekStart) || null
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teammates Status</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Total teammates: {getStatusStats().total}</span>
            <span>•</span>
            <span className={getStatusStats().withoutStatus > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
              {getStatusStats().withoutStatus} still need{getStatusStats().withoutStatus !== 1 ? '' : 's'} status for this week
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowAddDomainModal(true)}
          className="btn-secondary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Domain</span>
        </button>
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
              {getCurrentWeekKey(new Date()) === getCurrentWeekKey(selectedWeek) && (
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
              disabled={getCurrentWeekKey(new Date()) === getCurrentWeekKey(selectedWeek)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors h-10 ${
                getCurrentWeekKey(new Date()) === getCurrentWeekKey(selectedWeek)
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

      {/* Domain Tabs */}
      {domains.length > 0 && (
        <div className="mb-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {getSortedDomains().map(domain => (
                <div key={domain.id} className="flex items-center space-x-1 group">
                  <button
                    onClick={() => setActiveTab(domain.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === domain.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className={`p-1.5 rounded ${domain.bgColor}`}>
                      <div className={`${domain.color} text-sm`}>
                        {getIcon(domain.iconName)}
                      </div>
                    </div>
                    <span>{domain.name}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {domain.members.length}
                    </span>
                  </button>
                  <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditDomainModal(domain)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit domain"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </nav>
          </div>

                    {/* Tab Content */}
          {getSortedDomains().map(domain => (
            <div
              key={domain.id}
              className={`mt-6 ${activeTab === domain.id ? 'block' : 'hidden'}`}
            >
              <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-3 ${domain.bgColor} rounded-lg`}>
                  <div className={domain.color}>
                    {getIcon(domain.iconName)}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{domain.name}</h3>
                  <p className="text-sm text-gray-600">
                    {domain.members.length} team member{domain.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setNewMember({ ...newMember, domainId: domain.id })
                  setShowAddMemberModal(true)
                }}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative"
                title="Add team member"
              >
                <Plus size={20} />
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Add team member
                </span>
              </button>
            </div>

            {domain.members.length === 0 ? (
              <div className="text-center py-8">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No team members added yet</p>
                <p className="text-sm text-gray-400 mt-2">Click the + icon above to add a team member</p>
              </div>
            ) : (
              <div className="space-y-4">
                {domain.members.map(member => {
                  const status = getMemberStatus(member, currentWeekKey)
                  return (
                    <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        {editingMember?.domainId === domain.id && editingMember?.memberId === member.id ? (
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={editingMemberValues.name}
                              onChange={(e) => setEditingMemberValues({ ...editingMemberValues, name: e.target.value })}
                              className="input-field text-sm"
                              placeholder="Name"
                            />
                            <input
                              type="email"
                              value={editingMemberValues.email}
                              onChange={(e) => setEditingMemberValues({ ...editingMemberValues, email: e.target.value })}
                              className="input-field text-sm"
                              placeholder="Email"
                            />
                            <input
                              type="text"
                              value={editingMemberValues.slackChannelId}
                              onChange={(e) => setEditingMemberValues({ ...editingMemberValues, slackChannelId: e.target.value })}
                              className="input-field text-sm"
                              placeholder="Slack Channel ID (e.g., C1234567890)"
                            />
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-medium text-gray-900">{member.name}</h4>
                            <p className="text-sm text-gray-600">{member.email}</p>
                            {member.slackChannelId && (
                              <p className="text-xs text-gray-500">Slack: {member.slackChannelId}</p>
                            )}
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          {editingMember?.domainId === domain.id && editingMember?.memberId === member.id ? (
                            <>
                              <button
                                onClick={() => updateMember(domain.id, member.id, editingMemberValues)}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                title="Save changes"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingMember(null)
                                  setEditingMemberValues({ name: '', email: '', slackChannelId: '' })
                                }}
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingMemberValues({
                                    name: member.name,
                                    email: member.email,
                                    slackChannelId: member.slackChannelId || ''
                                  })
                                  setEditingMember({ domainId: domain.id, memberId: member.id })
                                }}
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                                title="Edit member"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  // Open Slack with the channel ID if available, otherwise use username
                                  const slackUrl = member.slackChannelId 
                                    ? `https://slack.com/app_redirect?channel=${member.slackChannelId}`
                                    : `https://slack.com/app_redirect?channel=@${member.name.toLowerCase().replace(/\s+/g, '.')}`
                                  window.open(slackUrl, '_blank')
                                }}
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center space-x-1"
                                title="PM on Slack"
                              >
                                <MessageCircle size={14} />
                                <span className="text-xs font-medium">PM</span>
                              </button>
                              <button
                                onClick={() => removeMember(domain.id, member.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Week Status
                          </label>
                          {editingStatus?.domainId === domain.id && 
                           editingStatus?.memberId === member.id && 
                           editingStatus?.field === 'currentWeek' ? (
                            <textarea
                              value={editingValues.currentWeek}
                              onChange={(e) => setEditingValues({ ...editingValues, currentWeek: e.target.value })}
                              onBlur={async () => {
                                await updateStatus(domain.id, member.id, 'currentWeek', editingValues.currentWeek)
                                setEditingStatus(null)
                                setEditingValues({ currentWeek: '', nextWeek: '', planned: '' })
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.metaKey) {
                                  e.preventDefault()
                                  e.currentTarget.blur()
                                }
                              }}
                              className="input-field w-full"
                              rows={3}
                              placeholder="What was accomplished this week..."
                              autoFocus
                            />
                          ) : (
                            <div 
                              onClick={() => {
                                setEditingValues({ currentWeek: status.currentWeek, nextWeek: status.nextWeek, planned: status.planned })
                                setEditingStatus({
                                  domainId: domain.id,
                                  memberId: member.id,
                                  field: 'currentWeek'
                                })
                              }}
                              className="p-3 bg-gray-50 rounded-lg min-h-[60px] cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              {status.currentWeek || (
                                <span className="text-gray-400 italic">Click to add status...</span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Next Week Plans
                          </label>
                          {editingStatus?.domainId === domain.id && 
                           editingStatus?.memberId === member.id && 
                           editingStatus?.field === 'nextWeek' ? (
                            <textarea
                              value={editingValues.nextWeek}
                              onChange={(e) => setEditingValues({ ...editingValues, nextWeek: e.target.value })}
                              onBlur={async () => {
                                await updateStatus(domain.id, member.id, 'nextWeek', editingValues.nextWeek)
                                setEditingStatus(null)
                                setEditingValues({ currentWeek: '', nextWeek: '', planned: '' })
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.metaKey) {
                                  e.preventDefault()
                                  e.currentTarget.blur()
                                }
                              }}
                              className="input-field w-full"
                              rows={3}
                              placeholder="What's planned for next week..."
                              autoFocus
                            />
                          ) : (
                            <div 
                              onClick={() => {
                                setEditingValues({ currentWeek: status.currentWeek, nextWeek: status.nextWeek, planned: status.planned })
                                setEditingStatus({
                                  domainId: domain.id,
                                  memberId: member.id,
                                  field: 'nextWeek'
                                })
                              }}
                              className="p-3 bg-gray-50 rounded-lg min-h-[60px] cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              {status.nextWeek || (
                                <span className="text-gray-400 italic">Click to add plans...</span>
                              )}
                            </div>
                          )}
                        </div>
                        

                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quarter Gantt View */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  Q{getCurrentQuarter().quarter} {getCurrentQuarter().year} Overview
                </h4>
                <span className="text-sm text-gray-500">
                  Sunday-Thursday weeks
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Header Row */}
                  <div className="flex border-b border-gray-200">
                    <div className="w-48 p-3 font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                      Team Member
                    </div>
                    {getQuarterWeeks().map((week, index) => (
                      <div 
                        key={week.start}
                        className={`w-32 p-2 text-xs font-medium text-center border-r border-gray-200 ${
                          week.isCurrentWeek ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="font-semibold">{week.display}</div>
                        {week.isCurrentWeek && (
                          <div className="text-blue-600 font-bold">CURRENT</div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Member Rows - Actual Status and Planned Tasks */}
                  {domain.members.map(member => (
                    <div key={member.id}>
                      {/* Actual Status Row */}
                      <div className="flex border-b border-gray-100 hover:bg-gray-50">
                        <div className="w-48 p-3 border-r border-gray-200 bg-gray-50">
                          <div className="font-medium text-gray-900">{member.name}</div>
                          <div className="text-xs text-gray-500">Actual Status</div>
                        </div>
                        {getQuarterWeeks().map(week => {
                          const status = getMemberStatusForWeek(member, week.start)
                          const hasStatus = status && (status.currentWeek || status.nextWeek)
                          
                          return (
                            <div 
                              key={week.start}
                              className={`w-32 p-2 text-xs border-r border-gray-200 ${
                                week.isCurrentWeek ? 'bg-blue-25' : ''
                              }`}
                            >
                              {hasStatus ? (
                                <div className="space-y-1">
                                  {status.currentWeek && (
                                    <div className="p-1 bg-green-100 text-green-800 rounded text-xs">
                                      <div className="font-medium">Current:</div>
                                      <div className="truncate" title={status.currentWeek}>
                                        {status.currentWeek.length > 20 
                                          ? status.currentWeek.substring(0, 20) + '...' 
                                          : status.currentWeek
                                        }
                                      </div>
                                    </div>
                                  )}
                                  {status.nextWeek && (
                                    <div className="p-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      <div className="font-medium">Next:</div>
                                      <div className="truncate" title={status.nextWeek}>
                                        {status.nextWeek.length > 20 
                                          ? status.nextWeek.substring(0, 20) + '...' 
                                          : status.nextWeek
                                        }
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-400 text-center py-2">
                                  —
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Planned Tasks Row */}
                      <div className="flex border-b border-gray-100 hover:bg-gray-50">
                        <div className="w-48 p-3 border-r border-gray-200 bg-orange-50">
                          <div className="text-xs text-orange-600">Planned Tasks</div>
                        </div>
                        {getQuarterWeeks().map(week => {
                          const status = getMemberStatusForWeek(member, week.start)
                          const hasPlanned = status && status.planned
                          
                          return (
                            <div 
                              key={week.start}
                              className={`w-32 p-2 text-xs border-r border-gray-200 ${
                                week.isCurrentWeek ? 'bg-orange-25' : ''
                              }`}
                            >
                              {hasPlanned ? (
                                <div 
                                  className={`p-1 rounded text-xs min-h-[60px] flex items-center cursor-pointer transition-colors border ${getPlannedTaskColor(member, status.planned) || 'bg-orange-100 text-orange-800 border-orange-200'} hover:opacity-80`}
                                  onClick={() => {
                                    setEditingPlannedData({
                                      domainId: domain.id,
                                      memberId: member.id,
                                      memberName: member.name,
                                      weekStart: week.start,
                                      weekDisplay: week.display,
                                      planned: status.planned || ''
                                    })
                                    setShowPlannedModal(true)
                                  }}
                                  title="Click to edit planned task"
                                >
                                  <div className="truncate" title={status.planned}>
                                    {status.planned.length > 25 
                                      ? status.planned.substring(0, 25) + '...' 
                                      : status.planned
                                    }
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="text-gray-400 text-center py-2 min-h-[60px] flex items-center justify-center cursor-pointer hover:bg-orange-50 rounded transition-colors"
                                  onClick={() => {
                                    setEditingPlannedData({
                                      domainId: domain.id,
                                      memberId: member.id,
                                      memberName: member.name,
                                      weekStart: week.start,
                                      weekDisplay: week.display,
                                      planned: ''
                                    })
                                    setShowPlannedModal(true)
                                  }}
                                  title="Click to add planned task"
                                >
                                  +
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="input-field"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="input-field"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <select
                  value={newMember.domainId}
                  onChange={(e) => setNewMember({...newMember, domainId: e.target.value})}
                  className="input-field"
                >
                  <option value="">Select a domain</option>
                  {domains.map(domain => (
                    <option key={domain.id} value={domain.id}>
                      {domain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slack Channel ID (Optional)
                </label>
                <input
                  type="text"
                  value={newMember.slackChannelId}
                  onChange={(e) => setNewMember({...newMember, slackChannelId: e.target.value})}
                  className="input-field"
                  placeholder="C1234567890"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the Slack channel ID (e.g., C1234567890) for direct messaging
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={addMember}
                className="btn-primary flex-1"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Domain Modal */}
      {showAddDomainModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Domain</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                  className="input-field"
                  placeholder="e.g., Data Protection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={newDomain.iconName}
                  onChange={(e) => setNewDomain({...newDomain, iconName: e.target.value})}
                  className="input-field"
                >
                  <option value="shield">Shield (Security)</option>
                  <option value="alert-triangle">Alert Triangle (Threat)</option>
                  <option value="file-check">File Check (Compliance)</option>
                  <option value="zap">Zap (Advanced)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Theme
                </label>
                <select
                  value={`${newDomain.color} ${newDomain.bgColor}`}
                  onChange={(e) => {
                    const [color, bgColor] = e.target.value.split(' ')
                    setNewDomain({...newDomain, color, bgColor})
                  }}
                  className="input-field"
                >
                  <option value="text-blue-600 bg-blue-100">Blue</option>
                  <option value="text-red-600 bg-red-100">Red</option>
                  <option value="text-green-600 bg-green-100">Green</option>
                  <option value="text-purple-600 bg-purple-100">Purple</option>
                  <option value="text-orange-600 bg-orange-100">Orange</option>
                  <option value="text-indigo-600 bg-indigo-100">Indigo</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddDomainModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={addDomain}
                className="btn-primary flex-1"
              >
                Add Domain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Domain Modal */}
      {showEditDomainModal && editingDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Edit Domain</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={editingDomainValues.name}
                  onChange={(e) => setEditingDomainValues({...editingDomainValues, name: e.target.value})}
                  className="input-field"
                  placeholder="e.g., Data Protection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={editingDomainValues.iconName}
                  onChange={(e) => setEditingDomainValues({...editingDomainValues, iconName: e.target.value})}
                  className="input-field"
                >
                  <option value="shield">Shield (Security)</option>
                  <option value="alert-triangle">Alert Triangle (Threat)</option>
                  <option value="file-check">File Check (Compliance)</option>
                  <option value="zap">Zap (Advanced)</option>
                  <option value="check-circle">Check Circle (QA)</option>
                  <option value="flask-conical">Flask Conical (R&D)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Theme
                </label>
                <select
                  value={`${editingDomainValues.color} ${editingDomainValues.bgColor}`}
                  onChange={(e) => {
                    const [color, bgColor] = e.target.value.split(' ')
                    setEditingDomainValues({...editingDomainValues, color, bgColor})
                  }}
                  className="input-field"
                >
                  <option value="text-blue-600 bg-blue-100">Blue</option>
                  <option value="text-red-600 bg-red-100">Red</option>
                  <option value="text-green-600 bg-green-100">Green</option>
                  <option value="text-purple-600 bg-purple-100">Purple</option>
                  <option value="text-orange-600 bg-orange-100">Orange</option>
                  <option value="text-indigo-600 bg-indigo-100">Indigo</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditDomainModal(false)
                  setEditingDomain(null)
                  setEditingDomainValues({ name: '', iconName: 'shield', color: 'text-blue-600', bgColor: 'bg-blue-100' })
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={editDomain}
                className="btn-primary flex-1"
              >
                Update Domain
              </button>
            </div>

            {/* Delete Section */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-red-100 rounded">
                    <X className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-sm text-red-800">
                    <p>Deleting this domain will permanently remove it and all associated team members and their status data.</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowEditDomainModal(false)
                  setEditingDomain(null)
                  setEditingDomainValues({ name: '', iconName: 'shield', color: 'text-blue-600', bgColor: 'bg-blue-100' })
                  openDeleteDomainModal(editingDomain!)
                }}
                className="btn-danger w-full"
              >
                Delete Domain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Domain Modal */}
      {showDeleteDomainModal && deletingDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Domain</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the domain <strong>"{deletingDomain.name}"</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-red-100 rounded">
                    <X className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">This action cannot be undone!</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>The domain will be permanently deleted</li>
                      <li>All {deletingDomain.memberCount} team member{deletingDomain.memberCount !== 1 ? 's' : ''} will be removed</li>
                      <li>All weekly status entries will be lost</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteDomainModal(false)
                  setDeletingDomain(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={deleteDomain}
                className="btn-danger flex-1"
              >
                Delete Domain
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Planned Tasks Modal */}
      {showPlannedModal && editingPlannedData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Edit Planned Tasks</h3>
            </div>
            
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                    {editingPlannedData.memberName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                    {editingPlannedData.weekDisplay}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planned Tasks
                </label>
                <textarea
                  value={editingPlannedData.planned}
                  onChange={(e) => setEditingPlannedData({
                    ...editingPlannedData,
                    planned: e.target.value
                  })}
                  className="input-field w-full"
                  rows={6}
                  placeholder="Enter planned tasks for this week..."
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe the tasks, goals, or objectives planned for this week.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPlannedModal(false)
                  setEditingPlannedData(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await updateStatus(
                      editingPlannedData.domainId,
                      editingPlannedData.memberId,
                      'planned',
                      editingPlannedData.planned,
                      editingPlannedData.weekStart
                    )
                    setShowPlannedModal(false)
                    setEditingPlannedData(null)
                  } catch (error) {
                    console.error('Error saving planned task:', error)
                    alert('Failed to save planned task. Please try again.')
                  }
                }}
                className="btn-primary flex-1"
              >
                Save Planned Task
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
} 