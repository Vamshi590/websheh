import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/login')
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Sri Harsha Eye Hospital</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-all flex items-center"
            >
              {isFullscreen ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0l5 0m-5 0v5m16-5l-5 5m5-5v5m-5 5l5 5m-5 0h5m-5 0v-5" />
                  </svg>
                  Exit Fullscreen
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5m-5 6h4m-4 0v4m0-4l5 5m5-9v4m0 0h-4m4 0l-5 5" />
                  </svg>
                  Fullscreen
                </>
              )}
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Quick Actions */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 hover:border-indigo-100">
              <Link
                to="/patients"
                className=""
              >
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-indigo-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm0 2a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1H5z"
                        clipRule="evenodd"
                      />
                      <path d="M7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Manage Patients</h3>
                </div>
                <p className="text-gray-600 ml-16">Add, edit, and manage patients records</p>
              </Link>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md cursor-pointer transition-all transform hover:-translate-y-1 hover:border-indigo-100">
              <Link
                to="/prescription"
                className=""
              >
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-indigo-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm0 2a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V7a1 1 0 00-1-1H5z"
                        clipRule="evenodd"
                      />
                      <path d="M7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Prescriptions</h3>
                </div>
                <p className="text-gray-600 ml-16">Manage prescriptions and receipts</p>
              </Link>
            </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
