import React, { useState, useEffect } from 'react'
import InpatientTable from "../components/Inpatients/InpatientTable"
import InPatientEditModal from '../components/Inpatients/InPatientEditModal'
import InPatientForm from '../components/Inpatients/InPatientForm'
import { toast, Toaster } from 'sonner'
import { addInPatient, deleteInPatient, getInPatients, updateInPatientAll } from '../components/patients/api'

// Define types for API responses
interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

// Define types for in-patient
export interface InPatient {
  id: string
  patientId: string
  opid?: string
  name: string
  age: string
  gender: string
  phone: string
  address: string
  dateOfBirth: string
  guardianName: string
  operationName: string
  admissionDate: string
  operationDate: string
  operationDetails?: string
  operationProcedure?: string
  provisionDiagnosis?: string
  department: string
  doctorNames: string[]
  onDutyDoctor: string
  referredBy: string
  packageAmount: number
  packageInclusions: PackageInclusion[]
  date: string
  createdBy?: string
  prescriptions?: Array<Record<string, unknown>>
  paymentRecords?: PaymentRecord[]
  discount?: number
  netAmount?: number
  totalReceivedAmount?: number
  balanceAmount?: number
  followUpDate?: string
  dischargeDate?: string
}

export interface PaymentRecord {
  date: string
  amountType: string
  paymentMode: string
  amount: number
}

export interface PackageInclusion {
  name: string
  amount: number
  subItems?: SubItem[]
}

export interface SubItem {
  itemName: string
  quantity: number
  rate: number
  amount: number
}

const InPatients: React.FC<{ showAddForm: boolean; setShowAddForm: (value: boolean) => void }> = ({
  showAddForm,
  setShowAddForm
}) => {
  const [inpatients, setInpatients] = useState<InPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedInPatient, setSelectedInPatient] = useState<InPatient | null>(null)

  // Function to fetch in-patients
  const fetchInPatients = async (): Promise<void> => {
    try {
      setLoading(true)
      // Use type assertion for API calls with more specific types
      const response = (await getInPatients()) as unknown as ApiResponse<InPatient[]>
      console.log(response)

      if (response.success) {
        setInpatients(response.data)
      } else {
        console.error('Error loading in-patients:', response.message)
        toast.error(response.message)
      }
    } catch (err) {
      console.error('Error loading in-patients:', err)
      toast.error('Failed to load in-patients')
    } finally {
      setLoading(false)
    }
  }

  // Load in-patients on component mount
  useEffect(() => {
    fetchInPatients()
  }, [])

  // Function to handle adding an in-patient
  const handleAddInPatient = async (inpatient: Omit<InPatient, 'id'>): Promise<void> => {
    try {
      const response = (await addInPatient(inpatient)) as unknown as ApiResponse<InPatient>

      if (response.success) {
        toast.success('In-patient added successfully')
        fetchInPatients()
        setShowAddForm(false)
      } else {
        console.error('Error adding in-patient:', response.message)
        toast.error(response.message)
      }
    } catch (err) {
      console.error('Error adding in-patient:', err)
      toast.error('Failed to add in-patient')
    }
  }

  // Function to handle updating an in-patient
  const handleUpdateInPatient = async (
    id: string,
    inpatient: Omit<InPatient, 'id'>
  ): Promise<void> => {
    try {
      const response = (await updateInPatientAll({
        id,
        inpatientData: inpatient
      })) as unknown as ApiResponse<InPatient>

      if (response.success) {
        toast.success('In-patient updated successfully')
        setShowEditModal(false)
        setSelectedInPatient(null)
        fetchInPatients()
      } else {
        console.error('Error updating in-patient:', response.message)
        toast.error(response.message)
      }
    } catch (err) {
      console.error('Error updating in-patient:', err)
      toast.error('Failed to update in-patient')
    }
  }

  // Function to handle deleting an in-patient
  const handleDeleteInPatient = async (id: string): Promise<void> => {
    try {
      const response = (await deleteInPatient(id)) as unknown as ApiResponse<{ id: string }>

      if (response.success) {
        setInpatients((prevInpatients) => prevInpatients.filter((p) => p.id !== id))
        toast.success('In-patient deleted successfully')
      } else {
        console.error('Error deleting in-patient:', response.message)
        toast.error(response.message)
      }
    } catch (err) {
      console.error('Error deleting in-patient:', err)
      toast.error('Failed to delete in-patient')
    }
  }

  // Function to open edit modal
  const openEditModal = (inpatient: InPatient): void => {
    setSelectedInPatient(inpatient)
    setShowEditModal(true)
  }

  return (
    <div className="mx-auto my-4">
      {/* In-Patient Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <InpatientTable
          inpatients={inpatients}
          onEdit={openEditModal}
          onDelete={handleDeleteInPatient}
        />
      )}

      {/* Add In-Patient Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New In-Patient</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <InPatientForm onSubmit={handleAddInPatient} />
          </div>
        </div>
      )}

      {/* Edit In-Patient Modal */}
      {showEditModal && selectedInPatient && (
        <InPatientEditModal
          inpatient={selectedInPatient}
          onUpdate={handleUpdateInPatient}
          onClose={() => {
            setShowEditModal(false)
            setSelectedInPatient(null)
          }}
        />
      )}

      <Toaster />
    </div>
  )
}

export default InPatients
