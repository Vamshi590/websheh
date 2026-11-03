// src/pages/Patients.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import { getTodaysPatientsWithCards, type PatientWithCards } from '../components/patients/api'
import AssignCardModal from '../components/patients/AssignCardModal'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// --- Module-level constant (computed once per session, never needs to update) -
const TODAY_IST = format(toZonedTime(new Date(), 'Asia/Kolkata'), 'dd MMM yyyy')

// --- Status badge --------------------------------------------------------
// Mirrors the badge logic in Prescriptions.tsx and the desktop PatientTable.

const AR_FIELDS = [
  'AR-RE-SPH','AR-RE-CYL','AR-RE-AXIS','AR-RE-VA','AR-RE-VAC.P.H',
  'AR-LE-SPH','AR-LE-CYL','AR-LE-AXIS','AR-LE-VA','AR-LE-VAC.P.H',
] as const

const MEDICAL_FIELDS = ['PRESENT COMPLAIN', 'PREVIOUS HISTORY'] as const

const hasField = (rx: Record<string, unknown>, fields: readonly string[]): boolean =>
  fields.some((f) => {
    const v = rx[f]
    return v !== undefined && v !== null && String(v).trim() !== ''
  })

const statusBadge = (rx: Record<string, unknown>): { label: string; cls: string } => {
  const ar = hasField(rx, AR_FIELDS)
  const med = hasField(rx, MEDICAL_FIELDS)
  if (!ar && !med) return { label: 'Optometrist', cls: 'bg-rose-50 text-rose-700 border-rose-200' }
  if (ar && !med)  return { label: 'Doctor',      cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (ar && med)   return { label: 'Complete',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  return             { label: 'Medical Only', cls: 'bg-sky-50 text-sky-700 border-sky-200' }
}

// --- Page ----------------------------------------------------------------

const Patients: React.FC = () => {
  const navigate = useNavigate()
  const [patients, setPatients] = useState<PatientWithCards[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignTarget, setAssignTarget] = useState<PatientWithCards | null>(null)

  const loadPatients = () => {
    setLoading(true)
    setError(null)
    getTodaysPatientsWithCards()
      .then(setPatients)
      .catch((e: Error) => {
        setError(e.message || 'Failed to load patients')
        toast.error(e.message || 'Failed to load patients')
      })
      .finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadPatients()
  }, [])

  const handleAssigned = (patientUuid: string, newCodes: string[]) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.patientUuid === patientUuid
          ? { ...p, assignedCards: [...p.assignedCards, ...newCodes] }
          : p
      )
    )
    setAssignTarget(null)
    toast.success(`Card${newCodes.length > 1 ? 's' : ''} assigned successfully`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-600">Patients</h1>
            <p className="text-xs text-gray-400">Sri Harsha Eye Hospital · {TODAY_IST}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="text-center py-16 text-gray-400 text-sm">Loading today's patients...</div>
        )}

        {!loading && error && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button
              onClick={loadPatients}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && patients.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">No patients today</p>
          </div>
        )}

        {patients.map((patient) => {
          const { label, cls } = statusBadge(patient.rxData)
          return (
            <div
              key={patient.patientUuid}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              {/* Name + status */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-gray-800 text-base leading-tight">{patient.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    #{patient.patientBusinessId}
                    {patient.phone ? ` · ${patient.phone}` : ''}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cls} shrink-0 ml-2`}>
                  {label}
                </span>
              </div>

              {/* Assigned cards */}
              <div className="mb-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                  Assigned Cards
                </div>
                {patient.assignedCards.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {patient.assignedCards.map((code) => (
                      <span
                        key={code}
                        className="font-mono text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-300 italic">None</span>
                )}
              </div>

              {/* Assign button */}
              <button
                onClick={() => setAssignTarget(patient)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                + Assign Card
              </button>
            </div>
          )
        })}
      </main>

      {/* Assign Card Modal */}
      {assignTarget && (
        <AssignCardModal
          isOpen={true}
          onClose={() => setAssignTarget(null)}
          onAssigned={(newCodes) => handleAssigned(assignTarget.patientUuid, newCodes)}
          patient={{
            uuid: assignTarget.patientUuid,
            name: assignTarget.name,
            patientBusinessId: assignTarget.patientBusinessId,
            phone: assignTarget.phone,
          }}
        />
      )}

      <Toaster position="top-center" richColors />
    </div>
  )
}

export default Patients
