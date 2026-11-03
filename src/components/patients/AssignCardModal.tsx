// src/components/patients/AssignCardModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getPoolCards, assignCardsToPatient, type PoolCard } from './api'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAssigned: (newCodes: string[]) => void
  patient: {
    uuid: string
    name: string
    patientBusinessId: string
    phone: string | null
  }
}

const AssignCardModal: React.FC<Props> = ({ isOpen, onClose, onAssigned, patient }) => {
  const [pool, setPool] = useState<PoolCard[]>([])
  const [codes, setCodes] = useState<string[]>([])
  const [cardQuery, setCardQuery] = useState('')
  const [cardDropOpen, setCardDropOpen] = useState(false)
  const [loadingPool, setLoadingPool] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const cardBoxRef = useRef<HTMLDivElement>(null)

  // Reset and load pool cards when modal opens
  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setCodes([])
    setPool([])
    setCardQuery('')
    setCardDropOpen(false)
    setErr('')
    setLoadingPool(true)
    getPoolCards()
      .then((cards) => { if (!cancelled) setPool(cards) })
      .catch((e: Error) => { if (!cancelled) setErr(e.message || 'Failed to load cards') })
      .finally(() => { if (!cancelled) setLoadingPool(false) })
    return () => { cancelled = true }
  }, [isOpen])

  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    if (!cardDropOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (cardBoxRef.current && !cardBoxRef.current.contains(e.target as Node)) {
        setCardDropOpen(false)
      }
    }
    const id = window.setTimeout(() => document.addEventListener('click', onDocClick), 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onDocClick)
    }
  }, [cardDropOpen])

  const filteredPool = useMemo(() => {
    const q = cardQuery.trim().toLowerCase()
    if (!q) return pool
    return pool.filter(
      (c) => c.code.toLowerCase().includes(q) || c.campaignName.toLowerCase().includes(q)
    )
  }, [pool, cardQuery])

  const toggleCode = (c: string) =>
    setCodes((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))

  const submit = async () => {
    if (!codes.length) return
    setBusy(true)
    setErr('')
    try {
      await assignCardsToPatient(codes, {
        uuid: patient.uuid,
        name: patient.name,
        phone: patient.phone,
      })
      onAssigned(codes)
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!isOpen) return null

  return (
    // Overlay
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Sheet / dialog */}
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Assign Referral Card
            </h2>
            <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Patient info */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
              <div className="text-xs uppercase text-indigo-600/70 tracking-wide mb-1">Patient</div>
              <div className="font-semibold text-gray-800">
                {patient.name}
                <span className="ml-2 text-sm text-gray-500 font-normal">#{patient.patientBusinessId}</span>
              </div>
              {patient.phone && <div className="text-sm text-gray-600 mt-0.5">{patient.phone}</div>}
            </div>

            {/* Card picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Cards{' '}
                {pool.length > 0 && (
                  <span className="text-xs text-gray-400">({pool.length} available)</span>
                )}
              </label>

              {/* Selected chips */}
              {codes.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {codes.map((c) => {
                    const card = pool.find((p) => p.code === c)
                    return (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold"
                      >
                        <span className="font-mono tracking-wider">{c}</span>
                        {card?.campaignName && (
                          <span className="text-indigo-400 font-normal">· {card.campaignName}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleCode(c)}
                          className="ml-0.5 p-1 text-indigo-400 hover:text-indigo-700"
                        >
                          &times;
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}

              {loadingPool ? (
                <div className="border border-gray-200 bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
                  Loading available cards...
                </div>
              ) : pool.length === 0 ? (
                <div className="border border-orange-200 bg-orange-50 rounded-lg p-4 text-sm text-orange-800">
                  No pool cards available. Generate cards in the desktop Campaigns module first.
                </div>
              ) : (
                <div className="relative" ref={cardBoxRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCardDropOpen((o) => !o)
                    }}
                    aria-expanded={cardDropOpen}
                    aria-haspopup="listbox"
                    className={`w-full text-left border rounded-lg px-3 py-3 flex items-center justify-between transition-colors ${
                      codes.length > 0
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-gray-300 bg-white hover:border-indigo-400'
                    }`}
                  >
                    <span className="text-sm text-gray-500">
                      {codes.length > 0
                        ? `${codes.length} card${codes.length > 1 ? 's' : ''} selected — tap to add more`
                        : 'Search and select cards...'}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-4 w-4 text-gray-400 transition-transform ${cardDropOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {cardDropOpen && (
                    <div className="mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden flex flex-col">
                      <div className="p-2 border-b border-gray-100">
                        <input
                          autoFocus
                          value={cardQuery}
                          onChange={(e) => setCardQuery(e.target.value)}
                          placeholder="Filter by code or campaign..."
                          className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="overflow-y-auto">
                        {filteredPool.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-gray-400 text-center">
                            No cards match &quot;{cardQuery}&quot;
                          </div>
                        ) : (
                          filteredPool.map((c) => {
                            const isSelected = codes.includes(c.code)
                            return (
                              <div
                                key={c.code}
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleCode(c.code)
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && toggleCode(c.code)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 text-sm cursor-pointer flex items-center justify-between ${
                                  isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                                }`}
                              >
                                <div>
                                  <div className="font-mono font-bold text-indigo-900 tracking-wider">
                                    {c.code}
                                  </div>
                                  {c.campaignName && (
                                    <div className="text-xs text-gray-500 mt-0.5">{c.campaignName}</div>
                                  )}
                                </div>
                                {isSelected && (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {err && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                {err}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                disabled={codes.length === 0 || busy}
                onClick={submit}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {busy
                  ? 'Assigning...'
                  : codes.length > 1
                    ? `Assign ${codes.length} cards`
                    : 'Assign card'}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignCardModal
