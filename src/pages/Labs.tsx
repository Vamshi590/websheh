import React, { useState, useEffect } from 'react'
import { toast, Toaster } from 'sonner'
import LabTableWithReceipts from '../components/labs/LabTableWithReceipts'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { useNavigate } from 'react-router-dom'
import { getTodaysLabs } from '../components/labs/api'
// import TodaysPrescriptionLabs from '../components/labs/TodaysPrescriptionLabs'

// Define the Lab type to match with LabTableWithReceipts component
type Lab = {
  id: string
  [key: string]: unknown
}

// Define StandardizedResponse interface for API responses
interface StandardizedResponse<T> {
  success: boolean
  data?: T | null
  error?: string | null
  statusCode?: number
  message?: string // For backward compatibility
}



const Labs: React.FC = () => {
  // State for labs and patients data
  const [labs, setLabs] = useState<Lab[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedDate] = useState<string>(
    format(toZonedTime(new Date(), 'Asia/Kolkata'), 'yyyy-MM-dd')
  )
  const navigate = useNavigate()
 

  // Load labs and today's labs data on component mount
  useEffect(() => {
    loadLabsByDate(selectedDate)
  }, [selectedDate])

  // Load labs by date
  const loadLabsByDate = async (date: string): Promise<void> => {
    setIsLoading(true)
    try {
      // Use getTodaysLabs as a fallback if date is today's date
      const todayDate = new Date().toISOString().split('T')[0]
      let response

      if (date === todayDate) {
        response = await getTodaysLabs()
      } else {
        toast.error('Failed to load labs data for date ' + date)
        return
      }

      // Handle standardized response format
      if (response && typeof response === 'object' && 'success' in response) {
        const standardizedResponse = response as StandardizedResponse<Lab[]>

        if (standardizedResponse.success && Array.isArray(standardizedResponse.data)) {
          setLabs(standardizedResponse.data)
        } else {
          console.error(
            `Failed to load labs for date ${date}:`,
            standardizedResponse.error || 'Unknown error'
          )
          toast.error(
            `Failed to load labs for date ${date}: ${standardizedResponse.error || 'Unknown error'}`
          )
          setLabs([])
        }
      } else if (Array.isArray(response)) {
        // Legacy format (direct array)
        setLabs(response)
      } else {
        console.error(`Invalid labs data format for date ${date}:`, response)
        setLabs([])
      }
    } catch (error) {
      console.error(`Error loading labs for date ${date}:`, error)
      toast.error(`Failed to load labs data for date ${date}`)
      setLabs([])
    } finally {
      setIsLoading(false)
    }
  }
 
  

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 mb-6">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-medium text-gray-800">Labs Management</h1>
            <p className="text-sm text-gray-500">Sri Harsha Eye Hospital</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Back</span>
            </button>
          </div>
        </div>
      </header>


   

      {/* Today's Prescription Labs Section */}
      {/* <TodaysPrescriptionLabs onCreateLab={handleCreateLabFromPrescription} /> */}

      {/* Labs Table Section */}
      <div className="max-w-7xl mx-auto px-6 py-4 sm:px-8 lg:px-10 mb-8 bg-white p-4 rounded-lg border border-gray-300">
        <h2 className="text-xl font-semibold mb-4">Lab Records for {selectedDate}</h2>
        {isLoading ? (
          <div className="text-center py-4">Loading labs data...</div>
        ) : (
          <LabTableWithReceipts
            labs={labs}
          />
        )}
      </div>

  
      {/* Toast Container */}
      <Toaster />
    </div>
  )
}

export default Labs
