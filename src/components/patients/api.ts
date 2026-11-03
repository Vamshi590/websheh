// src/components/patients/api.ts
import { supabase } from '../../SupabaseConfig'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export interface PatientWithCards {
  prescriptionId: string
  patientBusinessId: string   // e.g. "P-0042"
  patientUuid: string
  name: string
  phone: string | null
  rxData: Record<string, unknown>  // full prescription row — used for status badge logic
  assignedCards: string[]          // card codes currently assigned to this patient
}

export interface PoolCard {
  code: string
  campaignName: string
}

export const getTodaysPatientsWithCards = async (): Promise<PatientWithCards[]> => {
  const today = format(toZonedTime(new Date(), 'Asia/Kolkata'), 'yyyy-MM-dd')

  // 1. Today's prescriptions
  const { data: prescriptions, error: prescError } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('DATE', today)
    .order('Sno', { ascending: false })
  if (prescError) throw prescError
  if (!prescriptions || prescriptions.length === 0) return []

  // 2. Unique business patient IDs from prescriptions
  const businessIds = [
    ...new Set(
      (prescriptions as Record<string, unknown>[])
        .map((p) => p['PATIENT ID'] as string)
        .filter(Boolean)
    ),
  ]
  if (businessIds.length === 0) return []

  // 3. Resolve business IDs → UUIDs + name + phone from patients table
  const { data: patientRows, error: patientError } = await supabase
    .from('patients')
    .select('id, patientId, name, phone')
    .in('patientId', businessIds)
  if (patientError) throw patientError
  if (!patientRows || patientRows.length === 0) return []

  type PatientRow = { id: string; patientId: string; name: string; phone: string | null }
  const patientByBusinessId = new Map<string, PatientRow>(
    patientRows.map((p) => [p.patientId, p])
  )
  const uuids = patientRows.map((p) => p.id)

  // 4. Fetch assigned cards for these patients via referrers join
  // Uses the same join pattern as the desktop app's campaigns:getCardsByPatients handler.
  const cardsByUuid = new Map<string, string[]>()
  if (uuids.length > 0) {
    const { data: cardRows, error: cardError } = await supabase
      .from('referral_cards')
      .select('code, referrers!inner(ref_id)')
      .in('referrers.ref_id', uuids)
      .eq('referrers.referrer_type', 'patient')
      .eq('status', 'assigned')
    if (cardError) throw cardError

    for (const row of (cardRows || []) as unknown as Array<{
      code: string
      referrers: { ref_id: string }
    }>) {
      const uuid = row.referrers.ref_id
      const existing = cardsByUuid.get(uuid) || []
      cardsByUuid.set(uuid, [...existing, row.code])
    }
  }

  // 5. Merge prescriptions with patient info and cards
  const seen = new Set<string>()
  const result: PatientWithCards[] = []
  for (const rx of prescriptions as Record<string, unknown>[]) {
    const businessId = rx['PATIENT ID'] as string
    const patient = patientByBusinessId.get(businessId)
    if (!patient) continue
    // Deduplicate: if patient has multiple prescriptions today, show only first
    if (seen.has(patient.id)) continue
    seen.add(patient.id)
    result.push({
      prescriptionId: rx.id as string,
      patientBusinessId: businessId,
      patientUuid: patient.id,
      name: patient.name,
      phone: patient.phone,
      rxData: rx,
      assignedCards: cardsByUuid.get(patient.id) || [],
    })
  }
  return result
}
