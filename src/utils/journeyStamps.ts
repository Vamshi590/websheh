// Patient-journey timestamps for the Times tab in the Electron analytics.
// This runs client-side here (web app) and in the Electron main process —
// both write to the same Supabase table, so the logic must stay in sync.
//
// Stamps a column exactly once, the first time the matching data appears:
//   ar_entered_at   — any AR-* field non-empty
//   doctor_seen_at  — PRESENT COMPLAIN / PREVIOUS HISTORY non-empty
//   labs_advised_at — any ADVICE 1..15 slot non-empty

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
const MEDICAL_HISTORY_FIELDS = ['PRESENT COMPLAIN', 'PREVIOUS HISTORY'] as const

const nonEmpty = (v: unknown): boolean =>
  v !== undefined && v !== null && String(v).trim() !== ''

// True iff any of `keys` has a non-empty value in `row`.
const anyFilled = (keys: readonly string[], row: Record<string, unknown> | null): boolean =>
  !!row && keys.some((k) => nonEmpty(row[k]))

/**
 * Returns the subset of {ar_entered_at, doctor_seen_at, labs_advised_at} that
 * should be freshly set on this write.
 *
 * The stamp fires only when *this write* is what transitions the row from
 * empty → non-empty. Firing on the merged state would mis-stamp an AR-only
 * save as the "doctor saw patient" moment just because PRESENT COMPLAIN was
 * already in the stored row from an earlier write.
 */
export function computeJourneyStamps(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown> | null
): Record<string, string> {
  const now = new Date().toISOString()
  const stamps: Record<string, string> = {}
  const merged: Record<string, unknown> = { ...(existing || {}), ...incoming }

  // Only stamp when the field is being populated for the first time AND the
  // stamp hasn't already been set.
  if (
    !anyFilled(AR_FIELDS, existing) &&
    anyFilled(AR_FIELDS, merged) &&
    !existing?.ar_entered_at
  ) {
    stamps.ar_entered_at = now
  }
  if (
    !anyFilled(MEDICAL_HISTORY_FIELDS, existing) &&
    anyFilled(MEDICAL_HISTORY_FIELDS, merged) &&
    !existing?.doctor_seen_at
  ) {
    stamps.doctor_seen_at = now
  }

  const adviceKeys = Array.from({ length: 15 }, (_, i) => `ADVICE ${i + 1}`)
  if (
    !anyFilled(adviceKeys, existing) &&
    anyFilled(adviceKeys, merged) &&
    !existing?.labs_advised_at
  ) {
    stamps.labs_advised_at = now
  }

  return stamps
}
