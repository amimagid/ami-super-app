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
  MessageCircle
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
    }
  ])
  
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingStatus, setEditingStatus] = useState<{
    domainId: string
    memberId: string
    field: 'currentWeek' | 'nextWeek'
  } | null>(null)
  const [editingValues, setEditingValues] = useState<{
    currentWeek: string
    nextWeek: string
  }>({
    currentWeek: '',
    nextWeek: ''
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

  const [activeTab, setActiveTab] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Load data from database on mount
  useEffect(() => {
    loadWorkStatus()
  }, [selectedWeek])

  const loadWorkStatus = async () => {
    try {
      setLoading(true)
      const weekStart = getCurrentWeekKey(selectedWeek)
      const response = await fetch(`/api/work-status?weekStart=${weekStart}`)
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
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 })
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
      display: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    }
  }

  const getCurrentWeekKey = (date: Date) => {
    return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
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
      nextWeek: ''
    }
  }

  const updateStatus = async (domainId: string, memberId: string, field: 'currentWeek' | 'nextWeek', value: string) => {
    const weekStart = getCurrentWeekKey(selectedWeek)
    
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
        await loadWorkStatus()
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
      default:
        return <Shield size={24} />
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Work Status</h1>
          <p className="text-gray-600">Manage weekly status updates across all domains</p>
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
            <h3 className="text-lg font-semibold text-gray-900">
              {weekRange.display}
            </h3>
          </div>
          
          <button
            onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Domain Tabs */}
      {domains.length > 0 && (
        <div className="mb-8">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {domains.map(domain => (
                <button
                  key={domain.id}
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
              ))}
            </nav>
          </div>

                    {/* Tab Content */}
          {domains.map(domain => (
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
                            <div className="flex space-x-2">
                              <textarea
                                value={editingValues.currentWeek}
                                onChange={(e) => setEditingValues({ ...editingValues, currentWeek: e.target.value })}
                                className="input-field flex-1"
                                rows={3}
                                placeholder="What was accomplished this week..."
                              />
                              <button
                                onClick={async () => {
                                  await updateStatus(domain.id, member.id, 'currentWeek', editingValues.currentWeek)
                                  setEditingStatus(null)
                                  setEditingValues({ currentWeek: '', nextWeek: '' })
                                }}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                <Save size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <div className="flex-1 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                                {status.currentWeek || (
                                  <span className="text-gray-400 italic">No status added yet</span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingValues({ currentWeek: status.currentWeek, nextWeek: status.nextWeek })
                                  setEditingStatus({
                                    domainId: domain.id,
                                    memberId: member.id,
                                    field: 'currentWeek'
                                  })
                                }}
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <Edit3 size={16} />
                              </button>
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
                            <div className="flex space-x-2">
                              <textarea
                                value={editingValues.nextWeek}
                                onChange={(e) => setEditingValues({ ...editingValues, nextWeek: e.target.value })}
                                className="input-field flex-1"
                                rows={3}
                                placeholder="What's planned for next week..."
                              />
                              <button
                                onClick={async () => {
                                  await updateStatus(domain.id, member.id, 'nextWeek', editingValues.nextWeek)
                                  setEditingStatus(null)
                                  setEditingValues({ currentWeek: '', nextWeek: '' })
                                }}
                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                              >
                                <Save size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <div className="flex-1 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                                {status.nextWeek || (
                                  <span className="text-gray-400 italic">No plans added yet</span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setEditingValues({ currentWeek: status.currentWeek, nextWeek: status.nextWeek })
                                  setEditingStatus({
                                    domainId: domain.id,
                                    memberId: member.id,
                                    field: 'nextWeek'
                                  })
                                }}
                                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                <Edit3 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
    </div>
  )
} 