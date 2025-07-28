import React, { useState, useEffect } from 'react'
type Prescription = {
  id: string
  [key: string]: unknown
}

interface PrescriptionTableWithReceiptsProps {
  prescriptions: Prescription[]
  onEditPrescription?: (prescription: Prescription) => void
  onDeletePrescription?: (id: string) => void
}

const PrescriptionTableWithReceipts: React.FC<PrescriptionTableWithReceiptsProps> = ({
  prescriptions,
  onEditPrescription,
  onDeletePrescription
}) => {
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [selectedReceiptType, setSelectedReceiptType] = useState<string | null>(null)
  const [isReportMode, setIsReportMode] = useState<boolean>(false)
  const [isMobileView, setIsMobileView] = useState<boolean>(false)

  // Check if the screen is mobile-sized on component mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768) // 768px is typical md breakpoint
    }
    
    // Initial check
    checkIfMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile)
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Reset selection if current selection is no longer in filtered list
  useEffect(() => {
    if (selectedPrescription && !prescriptions.some((p) => p.id === selectedPrescription.id)) {
      setSelectedPrescription(null)
      setSelectedReceiptType(null)
      setIsReportMode(false)
    }
  }, [prescriptions, selectedPrescription])

  // Handle row click to select a prescription
  const handleRowClick = (prescription: Prescription): void => {
    if (selectedPrescription?.id === prescription.id) {
      // If clicking the same prescription, deselect it
      handleCloseReceipt()
    } else {
      setSelectedPrescription(prescription)
      setSelectedReceiptType(null) // Reset receipt type when selecting a new prescription
      setIsReportMode(false)
    }
  }

  // Handle closing the receipt viewer
  const handleCloseReceipt = (): void => {
    setSelectedPrescription(null)
    setSelectedReceiptType(null)
    setIsReportMode(false)
  }


  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-md">
        <p className="text-gray-500">No prescriptions found</p>
      </div>
    )
  }

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

  // Helper function to format prescription data for display
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    return String(value)
  }

  // Helper function to format currency values
  const formatCurrency = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    return `₹${value}`
  }

  return (
    <div id="main-content" className="space-y-4">
      {/* Receipt Options - Only show when a prescription is selected */}
      {selectedPrescription && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Receipt Options for {String(selectedPrescription['PATIENT NAME'])}
          </h3>

          <div className="flex justify-between items-center">

            <div className="flex space-x-2 mb-4">
              {onEditPrescription && (
                <button
                  onClick={() => onEditPrescription(selectedPrescription)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center"
                  title="Edit Prescription"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </button>
              )}
              {currentUser.isAdmin && onDeletePrescription && (
                <button
                  onClick={() => {
                    const patientName = selectedPrescription['PATIENT NAME'] || 'this patient'
                    const confirmMessage = `Are you sure you want to delete the prescription for ${patientName}?\n\nThis will permanently delete all prescription data, readings, and financial information.`

                    if (window.confirm(confirmMessage)) {
                      onDeletePrescription(selectedPrescription.id as string)
                      handleCloseReceipt()
                    }
                  }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors flex items-center"
                  title="Delete Prescription"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Receipt Viewer */}
          {(selectedReceiptType || isReportMode) && (
            <div
              id="receipt-container"
              className="mt-4 border border-gray-200 bg-gray-50 rounded-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-2 bg-gray-100 border-b border-gray-200">
                <h4 className="font-medium text-gray-700">
                  {isReportMode ? 'Full Report' : 'Receipt Preview'}
                </h4>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCloseReceipt}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                    title="Close Receipt"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Responsive Prescription Display */}
      {/* Desktop Table View (hidden on mobile) */}
      <div className={`${isMobileView ? 'hidden' : 'block'}`}>
        <div
          className="overflow-x-auto"
          style={{
            overflowX: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e0 #f9fafb'
          }}
        >
          <style>
            {`
            /* Custom scrollbar for WebKit browsers (Chrome, Safari) */
            div::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            div::-webkit-scrollbar-track {
              background: #f9fafb;
            }
            div::-webkit-scrollbar-thumb {
              background-color: #cbd5e0;
              border-radius: 6px;
            }
            `}
          </style>
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Sno
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Patient ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Patient Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Guardian Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  DOB
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Age
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Gender
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Phone Number
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Doctor
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount Received
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount Due
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prescriptions.map((prescription) => (
                <tr
                  key={`desktop-${prescription.id as string}`}
                  className={`hover:bg-gray-50 cursor-pointer ${selectedPrescription?.id === prescription.id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleRowClick(prescription)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription.Sno)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription.DATE)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription['PATIENT ID'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription['PATIENT NAME'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription['GUARDIAN NAME'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription.DOB)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription.AGE)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription.GENDER)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription['PHONE NUMBER'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(prescription['DOCTOR NAME'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(prescription['TOTAL AMOUNT'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(prescription['AMOUNT RECEIVED'])}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(prescription['AMOUNT DUE'])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile Card View (hidden on desktop) */}
      <div className={`${isMobileView ? 'block' : 'hidden'} space-y-4`}>
        {prescriptions.map((prescription) => (
          <div
            key={`mobile-${prescription.id as string}`}
            className={`bg-white rounded-lg shadow-sm border p-4 ${
              selectedPrescription?.id === prescription.id ? 'border-blue-500' : 'border-gray-200'
            }`}
            onClick={() => handleRowClick(prescription)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900">
                  {formatValue(prescription['PATIENT NAME'])}
                </h3>
                <p className="text-sm text-gray-500">
                  ID: {formatValue(prescription['PATIENT ID'])}
                </p>
              </div>
              <div className="text-right">
                 {onEditPrescription && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditPrescription(prescription);
                  }}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Edit
                </button>
              )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
              <div>
                <p className="text-gray-500">Guardian:</p>
                <p className="font-medium">{formatValue(prescription['GUARDIAN NAME'])}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone:</p>
                <p className="font-medium">{formatValue(prescription['PHONE NUMBER'])}</p>
              </div>
              <div>
                <p className="text-gray-500">Age/Gender:</p>
                <p className="font-medium">
                  {formatValue(prescription.AGE)} / {formatValue(prescription.GENDER)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Doctor:</p>
                <p className="font-medium">{formatValue(prescription['DOCTOR NAME'])}</p>
              </div>
            </div>
            
            <div className="mt-3 pt-2 flex justify-end space-x-2">
             
              {currentUser.isAdmin && onDeletePrescription && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const patientName = prescription['PATIENT NAME'] || 'this patient';
                    const confirmMessage = `Are you sure you want to delete the prescription for ${patientName}?`;

                    if (window.confirm(confirmMessage)) {
                      onDeletePrescription(prescription.id as string);
                      handleCloseReceipt();
                    }
                  }}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PrescriptionTableWithReceipts
