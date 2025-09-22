import React from 'react'
import { type Patient as ReceiptFormPatient } from './ReceiptForm'
import CombinedForm from './CombinedForm'
import { RxCross2 } from "react-icons/rx";

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
      <div className="flex items-center bg-black/30 justify-center min-h-screen text-center sm:block sm:p-0">
        <div
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all md:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          <div className="bg-white md:px-4 md:py-2">
            <div className="sm:flex sm:items-start">
              <div className="text-center sm:mt-0 sm:ml-4 sm:text-left w-full">

                <div className="mt-2 flex justify-between items-center border-b border-gray-200 pb-2 px-4">

                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">Edit Prescription</h2>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Trigger form submission via ref or other method
                        document
                          .querySelector('form')
                          ?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
                      }}
                      className="ml-3 inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 md:py-1.5 py-1 cursor-pointer bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    >
                      Save
                    </button>



                    <button
                      type="button"
                      onClick={onClose}
                      className="cursor-pointer font-bold"
                    >
                      <RxCross2 size={20} />
                    </button>
                  </div>




                </div>

                <div className="max-h-[90vh] md:max-h-[80vh] overflow-y-auto">
                  {/* Prescription Form Tab */}

                  <CombinedForm
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    initialData={prescription}
                    selectedPatient={patient}
                    patients={[patient]}
                  />

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrescriptionEditModal
