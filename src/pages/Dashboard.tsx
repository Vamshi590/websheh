import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../SupabaseConfig'
import { useNavigate } from 'react-router-dom'
// User interface removed as it's no longer needed

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  created_at: string
  last_visit?: string
}

const Dashboard: React.FC = () => {
  const [recentPatients, setRecentPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch recent patients
    fetchRecentPatients()
  }, [])

  const fetchRecentPatients = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching patients:', error)
      } else {
        setRecentPatients(data || [])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Sri Harsha Eye Hospital</h1>
          </div>
          <div className="flex items-center space-x-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="bg-white shadow-sm rounded-lg p-6 col-span-2">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                to="/prescription"
                className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-indigo-600 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-gray-700">Prescription</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Patients</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : recentPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Age/Gender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Visit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {patient.age} / {patient.gender}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{patient.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(patient.last_visit || patient.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/prescription?patientId=${patient.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          New Prescription
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">No recent patients found</div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
