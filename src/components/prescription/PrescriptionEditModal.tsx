import React, { useState, useEffect } from 'react'
import PrescriptionForm from './PrescriptionForm'
import ReceiptForm, { type Patient as ReceiptFormPatient } from './ReceiptForm'
import ReadingForm from './ReadingForm'

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
  prescriptionCount
}) => {
  const [activeTab, setActiveTab] = useState<'prescription' | 'receipt' | 'readings'>(
    'prescription'
  )

  // Create receipt data from prescription data
  const [receiptData, setReceiptData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    if (prescription) {
      // Initialize receipt data with prescription data
      setReceiptData({
        // Keep all original prescription data
        ...prescription,
        // Ensure these specific receipt fields are included
        'RECEIPT NO': prescription['RECEIPT NO'] || '',
        'PAID FOR': prescription['PAID FOR'] || '',
        MODE: prescription['MODE'] || 'Cash',
        'TOTAL AMOUNT': prescription['TOTAL AMOUNT'] || '',
        'ADVANCE PAID': prescription['ADVANCE PAID'] || '0',
        'AMOUNT RECEIVED': prescription['AMOUNT RECEIVED'] || '',
        'DISCOUNT PERCENTAG': prescription['DISCOUNT PERCENTAG'] || '0',
        'DISCOUNT AMOUNT': prescription['DISCOUNT AMOUNT'] || '0',
        'AMOUNT DUE': prescription['AMOUNT DUE'] || ''
      })
    }
  }, [prescription])

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center backdrop-blur-sm justify-center min-h-screen pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div className="bg-white md:px-4 pt-5 pb-4 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  Edit Patient Record
                </h3>

                {/* Tabs for switching between forms */}
                <div className="border-b border-gray-200 mt-4 overflow-x-auto ">
                  <nav className="md:px-4 pt-5 pb-4 flex space-x-8" aria-label="Tabs">
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
                    <button
                      onClick={() => setActiveTab('receipt')}
                      className={`${
                        activeTab === 'receipt'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Cash Receipt Form
                    </button>
                    <button
                      onClick={() => setActiveTab('readings')}
                      className={`${
                        activeTab === 'readings'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Eye Readings Form
                    </button>
                  </nav>
                </div>

                <div className="mt-4 max-h-[70vh] overflow-y-auto">
                  {/* Prescription Form Tab */}
                  {activeTab === 'prescription' && (
                    <PrescriptionForm
                      onSubmit={handleSubmit}
                      onCancel={onClose}
                      initialData={prescription}
                      prescriptionCount={prescriptionCount}
                    />
                  )}

                  {/* Cash Receipt Form Tab */}
                  {activeTab === 'receipt' && (
                    <ReceiptForm
                      onSubmit={handleSubmit}
                      onCancel={onClose}
                      selectedPatient={patient}
                      patients={[patient]}
                      initialData={receiptData}
                    />
                  )}

                  {/* Eye Readings Form Tab */}
                  {activeTab === 'readings' && (
                    <ReadingForm
                      onSubmit={handleSubmit}
                      onCancel={onClose}
                      selectedPatient={patient}
                      initialData={prescription}
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
