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

export const getTodaysPatientsWithCards = async (date?: string): Promise<PatientWithCards[]> => {
  const today = date ?? format(toZonedTime(new Date(), 'Asia/Kolkata'), 'yyyy-MM-dd')

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

export const getPoolCards = async (): Promise<PoolCard[]> => {
  const { data: campaigns, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('type', 'patient')
    .eq('status', 'active')
  if (campaignError) throw campaignError
  if (!campaigns || campaigns.length === 0) return []

  const typedCampaigns = campaigns as Array<{ id: string; name: string }>
  const campaignIds = typedCampaigns.map((c) => c.id)
  const nameById = new Map(typedCampaigns.map((c) => [c.id, c.name]))

  const { data: cards, error: cardsError } = await supabase
    .from('referral_cards')
    .select('code, campaign_id')
    .in('campaign_id', campaignIds)
    .eq('status', 'available')
    .is('referrer_id', null)
    .order('created_at', { ascending: true })
  if (cardsError) throw cardsError

  return (cards as Array<{ code: string; campaign_id: string }> || []).map((c) => ({
    code: c.code,
    campaignName: nameById.get(c.campaign_id) || '',
  }))
}

export const assignCardsToPatient = async (
  codes: string[],
  patient: { uuid: string; name: string; phone: string | null }
): Promise<void> => {
  const now = new Date().toISOString()
  for (const code of codes) {
    // 1. Verify card exists and is available
    const { data: cardRaw, error: cardError } = await supabase
      .from('referral_cards')
      .select('campaign_id, status')
      .eq('code', code.toUpperCase())
      .single()
    if (cardError || !cardRaw) throw new Error(`Card ${code} not found`)
    const card = cardRaw as { campaign_id: string; status: string }
    if (card.status !== 'available')
      throw new Error(`Card ${code} is ${card.status}`)

    // 2. Create patient referrer row — if the patient is already a referrer in
    //    this campaign (unique constraint on campaign_id + referrer_type + ref_id),
    //    fetch and reuse the existing row instead of throwing.
    let typedReferrer: { id: string }
    const { data: insertedReferrer, error: refError } = await supabase
      .from('referrers')
      .insert({
        campaign_id: card.campaign_id,
        referrer_type: 'patient',
        ref_id: patient.uuid,
        name: patient.name,
        phone: patient.phone,
        address: null,
        contact_person: null,
        approved_at: now,
      })
      .select()
      .single()
    if (refError) {
      // 23505 = unique_violation — patient already a referrer in this campaign
      if ((refError as { code?: string }).code === '23505') {
        const { data: existing, error: fetchErr } = await supabase
          .from('referrers')
          .select('id')
          .eq('campaign_id', card.campaign_id)
          .eq('referrer_type', 'patient')
          .eq('ref_id', patient.uuid)
          .single()
        if (fetchErr || !existing) throw fetchErr || new Error(`Failed to fetch existing referrer for card ${code}`)
        typedReferrer = existing as { id: string }
      } else {
        throw refError
      }
    } else {
      if (!insertedReferrer) throw new Error(`Failed to create referrer row for card ${code}`)
      typedReferrer = insertedReferrer as { id: string }
    }

    // 3. Flip card to assigned
    const { error: updateError } = await supabase
      .from('referral_cards')
      .update({
        referrer_id: typedReferrer.id,
        status: 'assigned',
        assigned_at: now,
      })
      .eq('code', code.toUpperCase())
    if (updateError) throw updateError
  }
}
