import React from 'react'
import InPatientForm from './InPatientForm'
import { type InPatient } from '../../pages/Inpatients'

interface InPatientEditModalProps {
  inpatient: InPatient
  onUpdate: (id: string, inpatient: Omit<InPatient, 'id'>) => Promise<void>
  onClose: () => void
}

const InPatientEditModal: React.FC<InPatientEditModalProps> = ({
  inpatient,
  onUpdate,
  onClose
}) => {
  const handleSubmit = async (formData: Omit<InPatient, 'id'>): Promise<void> => {
    await onUpdate(inpatient.id, formData)
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit In-Patient</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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
        <InPatientForm onSubmit={handleSubmit} initialValues={inpatient} />
      </div>
    </div>
  )
}

export default InPatientEditModal
