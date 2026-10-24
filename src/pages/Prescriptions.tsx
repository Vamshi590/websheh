// Eye Readings — mobile worklist used by optometrists to enter AR / PGP / GR
// / CF readings against prescriptions created in the Electron app at reception.
// This page intentionally doesn't create prescriptions or receipts — those
// stay in the desktop app. We just read today's rows and write readings back.

import React, { useEffect, useMemo, useState } from 'react'
import { toast, Toaster } from 'sonner'
import { useNavigate } from 'react-router-dom'
import EyeReadingsEditModal from '../components/prescription/EyeReadingsEditModal'
import {
  getTodaysPrescriptions,
  getPrescriptionsByPatientId,
  updatePrescriptionReadings,
  type Prescription
} from '../components/prescription/api'

const AR_FIELDS = [
  'AR-RE-SPH',
  'AR-RE-CYL',
  'AR-RE-AXIS',
  'AR-RE-VA',
  'AR-RE-VAC.P.H',
  'AR-LE-SPH',
  'AR-LE-CYL',
  'AR-LE-AXIS',
  'AR-LE-VA',
  'AR-LE-VAC.P.H'
] as const

const hasArReadings = (p: Prescription): boolean =>
  AR_FIELDS.some((f) => {
    const v = p[f as string]
    return v !== undefined && v !== null && String(v).trim() !== ''
  })

const MEDICAL_FIELDS = ['PRESENT COMPLAIN', 'PREVIOUS HISTORY'] as const

const hasMedicalHistory = (p: Prescription): boolean =>
  MEDICAL_FIELDS.some((f) => {
    const v = p[f as string]
    return v !== undefined && v !== null && String(v).trim() !== ''
  })

// Where the patient is in the journey. Mirrors the status pill used in the
// desktop app so staff see consistent labels across devices.
const patientStatus = (
  p: Prescription
): { label: string; badge: string } => {
  const ar = hasArReadings(p)
  const med = hasMedicalHistory(p)
  if (!ar && !med)
    return { label: 'Optometrist', badge: 'bg-rose-50 text-rose-700 border-rose-200' }
  if (ar && !med)
    return { label: 'Doctor', badge: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (ar && med)
    return { label: 'Complete', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  return { label: 'Medical Only', badge: 'bg-sky-50 text-sky-700 border-sky-200' }
}

// 94 → "1h 34m". Keeps minute-level precision but reads naturally once the
// wait crosses an hour (which happens often on busy days).
const formatWait = (mins: number): string => {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// Minutes since the prescription was created at the reception counter.
// Column name is uppercase "CREATED AT" (set by Supabase/addPrescription).
// Returns null when the row has no timestamp so we don't light up the card.
const minutesSinceCreated = (p: Prescription, nowMs: number): number | null => {
  const raw = p['CREATED AT'] ?? p['created_at']
  if (!raw) return null
  const t = new Date(String(raw)).getTime()
  if (!Number.isFinite(t)) return null
  return Math.max(0, Math.floor((nowMs - t) / 60000))
}

// Card tone picker. Only pending-AR rows escalate — once AR is done the card
// stays neutral so it doesn't visually scream after the fact.
const toneForWait = (
  mins: number | null,
  hasAr: boolean
): { card: string; badge: string } => {
  if (hasAr) {
    return {
      card: 'bg-white border-gray-200 hover:border-indigo-300',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  }
  if (mins == null || mins < 5) {
    return {
      card: 'bg-white border-gray-200 hover:border-indigo-300',
      badge: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  }
  if (mins < 9) {
    return {
      card: 'bg-amber-50 border-amber-300 hover:border-amber-500',
      badge: 'bg-amber-100 text-amber-800 border-amber-300'
    }
  }
  return {
    card: 'bg-rose-50 border-rose-300 hover:border-rose-500',
    badge: 'bg-rose-100 text-rose-800 border-rose-300'
  }
}

const getCurrentUser = (): string => {
  try {
    const raw = localStorage.getItem('currentUser')
    if (!raw) return 'Unknown User'
    const u = JSON.parse(raw) as { fullName?: string; username?: string; name?: string }
    return u.fullName || u.username || u.name || 'Unknown User'
  } catch {
    return 'Unknown User'
  }
}

const EyeReadings: React.FC = () => {
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending'>('pending')
  const [editing, setEditing] = useState<Prescription | null>(null)
  // Re-render every 20s so wait-time colours and badges tick without a reload.
  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 20_000)
    return () => window.clearInterval(id)
  }, [])

  const load = async (): Promise<void> => {
    setLoading(true)
    try {
      const q = search.trim()
      // Numeric-looking searches hit the by-patient endpoint so staff can jump
      // straight to a specific patient's history; otherwise show today's list.
      const data = /^[A-Za-z0-9-]{3,}$/.test(q)
        ? await getPrescriptionsByPatientId(q)
        : await getTodaysPrescriptions()
      setPrescriptions(data)
    } catch (e) {
      toast.error(`Failed to load: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return prescriptions.filter((p) => {
      if (filter === 'pending' && hasArReadings(p)) return false
      if (!q) return true
      const name = String(p['PATIENT NAME'] ?? '').toLowerCase()
      const pid = String(p['PATIENT ID'] ?? '').toLowerCase()
      const phone = String(p['PHONE NUMBER'] ?? '').toLowerCase()
      return name.includes(q) || pid.includes(q) || phone.includes(q)
    })
  }, [prescriptions, search, filter])

  const handleSave = async (updated: Prescription): Promise<void> => {
    if (!updated.id) return
    const res = await updatePrescriptionReadings(updated.id, updated, getCurrentUser())
    if (!res.success) {
      toast.error(res.message || 'Save failed')
      return
    }
    toast.success('Reading saved')
    // Patch the row in place so the list reflects the new AR state without a round-trip.
    setPrescriptions((rows) =>
      rows.map((r) => (r.id === updated.id ? ({ ...r, ...(res.data || updated) } as Prescription) : r))
    )
    setEditing(null)
  }

  const pendingCount = prescriptions.filter((p) => !hasArReadings(p)).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Eye Readings</h1>
            <p className="text-xs text-gray-500 mt-0.5">Enter AR / PGP / GR for today's patients</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            ← Back
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 text-sm font-medium ${
                filter === 'pending'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Pending AR
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === 'pending' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {pendingCount}
              </span>
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {prescriptions.length}
              </span>
            </button>
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void load()
              }}
              placeholder="Search name, patient ID or phone…"
              className="w-full pl-3 pr-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>
          <button
            onClick={load}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
          >
            ↻
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5">
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-500">Loading…</div>
        ) : filteredRows.length === 0 ? (
          <div className="text-center py-16 bg-white border border-gray-200 rounded-xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl">
              👁
            </div>
            <p className="mt-3 text-sm font-medium text-gray-800">
              {filter === 'pending' ? 'No pending AR for today' : 'No prescriptions found'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {filter === 'pending'
                ? 'All of today’s patients have their AR entered.'
                : 'Try a different search.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredRows.map((p) => {
              const hasAr = hasArReadings(p)
              const mins = minutesSinceCreated(p, nowMs)
              const tone = toneForWait(mins, hasAr)
              return (
                <li key={String(p.id)}>
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className={`w-full text-left border rounded-xl p-4 hover:shadow-sm transition ${tone.card}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 truncate">
                            {String(p['PATIENT NAME'] || 'Unnamed')}
                          </span>
                          <span className="text-xs font-mono text-gray-400">
                            #{String(p['PATIENT ID'] || '')}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                          {p.AGE != null && <span>Age {String(p.AGE)}</span>}
                          {!!p.GENDER && <span>{String(p.GENDER)}</span>}
                          {!!p['PHONE NUMBER'] && <span>{String(p['PHONE NUMBER'])}</span>}
                          {!!p.DATE && <span>{String(p.DATE)}</span>}
                          {!hasAr && mins != null && (
                            <span className="font-medium text-gray-700">
                              Waiting {formatWait(mins)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${tone.badge}`}
                        >
                          {hasAr ? 'AR done' : 'Pending'}
                        </span>
                        {(() => {
                          const s = patientStatus(p)
                          return (
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${s.badge}`}
                            >
                              {s.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </main>

      {editing && (
        <EyeReadingsEditModal
          isOpen={true}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          eyeReading={editing as { id: string; [key: string]: unknown }}
        />
      )}
    </div>
  )
}

export default EyeReadings
