import React, { useState } from 'react'
import { type Patient as ReceiptFormPatient } from './ReceiptForm'
import CombinedForm from './CombinedForm'

// Define the Prescription type to match with other components
type Prescription = {
  id: string
  [key: string]: unknown
}

interface PrescriptionEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (prescription: Prescription) => Promise<void>
  prescription: Prescription | null
  prescriptionCount: number
}

const PrescriptionEditModal: React.FC<PrescriptionEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  prescription,
}) => {
  const [activeTab, setActiveTab] = useState<'prescription' | 'receipt' | 'readings'>(
    'prescription'
  )


  if (!isOpen || !prescription) return null

  const handleSubmit = async (updatedPrescription: Record<string, unknown>): Promise<void> => {
    // Ensure we keep the original ID
    const prescriptionWithId = {
      ...updatedPrescription,
      id: prescription?.id
    } as Prescription

    await onSave(prescriptionWithId)
    onClose()
  }

  // Convert prescription to patient format for receipt form
  const convertToReceiptFormPatient = (prescription: Prescription): ReceiptFormPatient => {
    return {
      id: prescription.id as string,
      patientId: (prescription['PATIENT ID'] as string) || '',
      name: (prescription['PATIENT NAME'] as string) || '',
      guardian: (prescription['GUARDIAN NAME'] as string) || '',
      phone: (prescription['PHONE NUMBER'] as string) || '',
      age: (prescription.AGE as string) || '',
      gender: (prescription.GENDER as string) || '',
      address: (prescription.ADDRESS as string) || '',
      dob: (prescription.DOB as string) || '',
      date: (prescription.DATE as string) || '',
      doctorName: (prescription['DOCTOR NAME'] as string) || '',
      department: (prescription.DEPARTMENT as string) || '',
      referredBy: (prescription['REFERRED BY'] as string) || ''
    }
  }

  const patient = convertToReceiptFormPatient(prescription)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto sm:border sm:rounded-lg sm:border-gray-500">
      <div className="flex items-center backdrop-blur-sm justify-center min-h-screen md:pb-20 text-center sm:block sm:p-0">
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all md:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div className="bg-white md:px-4 md:pt-5 md:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">

              <div className="flex justify-between items-center border-b border-gray-200 pb-2 px-4">
                  {/* Tabs for switching between forms */}
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      <button
                        onClick={() => setActiveTab('prescription')}
                        className={`${
                          activeTab === 'prescription'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        Prescription Form
                      </button>
                    </nav>
                  </div>

                  {/* Save button aligned to the right */}
                  {activeTab === 'prescription' && (
                    <button
                      type="button"
                      onClick={() => {
                        // Trigger form submission via ref or other method
                        document
                          .querySelector('form')
                          ?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
                      }}
                      className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                      Save
                    </button>
                  )}
                </div>

                <div className="mt-4 max-h-[70vh] overflow-y-auto">
                  {/* Prescription Form Tab */}
                  {activeTab === 'prescription' && (
                    <CombinedForm
                      onSubmit={handleSubmit}
                      onCancel={onClose}
                      initialData={prescription}
                      selectedPatient={patient}
                      patients={[patient]}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrescriptionEditModal
