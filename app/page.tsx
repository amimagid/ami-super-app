'use client'

import { useState } from 'react'
import { Heart, Briefcase, Home, CheckSquare } from 'lucide-react'
import HealthLog from '@/components/HealthLog'
import WorkStatus from '@/components/WorkStatus'
import MyTasks from '@/components/MyTasks'
import HomeDashboard from '@/components/HomeDashboard'

export default function HomePage() {
  const [activeApp, setActiveApp] = useState<'home' | 'health' | 'work' | 'tasks'>('home')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Ami's Super App</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveApp('home')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeApp === 'home'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home size={20} />
                <span>Home</span>
              </button>
              <button
                onClick={() => setActiveApp('health')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeApp === 'health'
                    ? 'bg-health-100 text-health-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart size={20} />
                <span>Health Log</span>
              </button>
              <button
                onClick={() => setActiveApp('work')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeApp === 'work'
                    ? 'bg-work-100 text-work-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Briefcase size={20} />
                <span>Work Status</span>
              </button>
              <button
                onClick={() => setActiveApp('tasks')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeApp === 'tasks'
                    ? 'bg-tasks-100 text-tasks-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CheckSquare size={20} />
                <span>My Tasks</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeApp === 'home' && (
          <HomeDashboard onNavigate={setActiveApp} />
        )}

        {activeApp === 'health' && <HealthLog />}
        {activeApp === 'work' && <WorkStatus />}
        {activeApp === 'tasks' && <MyTasks />}
      </main>
    </div>
  )
} 