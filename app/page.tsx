'use client'

import { useState } from 'react'
import { Heart, Briefcase, Home } from 'lucide-react'
import HealthLog from '@/components/HealthLog'
import WorkStatus from '@/components/WorkStatus'

export default function HomePage() {
  const [activeApp, setActiveApp] = useState<'home' | 'health' | 'work'>('home')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Ami Super App</h1>
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
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeApp === 'home' && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Your Super App
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Manage your health tracking and work status all in one place
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div 
                className="card cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => setActiveApp('health')}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-health-100 rounded-lg">
                    <Heart className="text-health-600" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Health Log</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Track your weight, blood pressure, workouts, and more. View daily logs, 
                  upload CSV data, and analyze trends with beautiful charts.
                </p>
                <div className="flex items-center text-health-600 font-medium">
                  <span>Open Health Log</span>
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div 
                className="card cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => setActiveApp('work')}
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-work-100 rounded-lg">
                    <Briefcase className="text-work-600" size={24} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Work Status</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Manage weekly status updates across Platform Security, Threat Protection, 
                  Compliance, and Advanced Protection domains with team member tracking.
                </p>
                <div className="flex items-center text-work-600 font-medium">
                  <span>Open Work Status</span>
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeApp === 'health' && <HealthLog />}
        {activeApp === 'work' && <WorkStatus />}
      </main>
    </div>
  )
} 