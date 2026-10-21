// Minimal prescription API used by the mobile Eye Readings view. The mobile
// app no longer creates prescriptions / receipts — those are owned by the
// Electron app — it only reads existing rows and writes AR / eye-reading
// fields back onto them.

import { supabase } from '../../SupabaseConfig'
import { computeJourneyStamps } from '../../utils/journeyStamps'

export interface Prescription {
  id?: string
  patientId?: string
  patientName?: string
  phone?: string
  age?: string | number
  gender?: string
  address?: string
  date?: string
  TYPE?: string
  DATE?: string
  'PATIENT ID'?: string
  'PATIENT NAME'?: string
  'PHONE NUMBER'?: string
  'RECEIPT NO'?: string
  Sno?: string
  [key: string]: unknown
}

// Paginated list of prescriptions, newest first by DATE.
export const getPrescriptions = async (
  page = 1,
  pageSize = 20
): Promise<{
  success: boolean
  data: Prescription[]
  totalCount?: number
  page?: number
  pageSize?: number
  totalPages?: number
  message?: string
}> => {
  try {
    const pageNum = Number(page)
    const pageSizeNum = Number(pageSize)
    const from = (pageNum - 1) * pageSizeNum
    const to = from + pageSizeNum - 1

    const { count, error: countError } = await supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
    if (countError) throw countError

    const { data, error } = await supabase
      .from('prescriptions')
      .select('*')
      .order('DATE', { ascending: false })
      .range(from, to)
    if (error) throw error

    return {
      success: true,
      data: data || [],
      totalCount: count || 0,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil((count || 0) / pageSizeNum)
    }
  } catch (error) {
    console.error('Error getting prescriptions:', error)
    return {
      success: false,
      data: [],
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Fetch prescriptions where DATE matches today, newest Sno first. Used as the
// default worklist on the Eye Readings page.
export const getTodaysPrescriptions = async (): Promise<Prescription[]> => {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('DATE', today)
    .order('Sno', { ascending: false })
  if (error) {
    console.error('getTodaysPrescriptions failed:', error)
    return []
  }
  return (data as Prescription[]) || []
}

// Fetch prescriptions for a single patient (search view).
export const getPrescriptionsByPatientId = async (
  patientId: string
): Promise<Prescription[]> => {
  const { data, error } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('PATIENT ID', patientId)
    .order('DATE', { ascending: false })
  if (error) {
    console.error('getPrescriptionsByPatientId failed:', error)
    return []
  }
  return (data as Prescription[]) || []
}

// Diff-aware update used when staff save eye readings. Fetches the latest row
// so we only persist actually-changed fields and so the journey timestamps
// (ar_entered_at / doctor_seen_at / labs_advised_at) fire exactly once.
export const updatePrescriptionReadings = async (
  id: string,
  patch: Prescription,
  updatedBy: string
): Promise<{ success: boolean; data?: Prescription; message?: string }> => {
  try {
    const { data: latest, error: fetchErr } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchErr) throw fetchErr
    if (!latest) throw new Error('Prescription not found')

    const changedFields: Record<string, unknown> = {}
    Object.entries(patch).forEach(([key, value]) => {
      if (key === 'id') return
      if (JSON.stringify(value) !== JSON.stringify((latest as Record<string, unknown>)[key])) {
        changedFields[key] = value
      }
    })

    if (Object.keys(changedFields).length === 0) {
      return { success: true, data: latest as Prescription, message: 'Nothing changed' }
    }

    changedFields['UPDATED BY'] = updatedBy
    changedFields['UPDATED AT'] = new Date().toISOString()

    Object.assign(
      changedFields,
      computeJourneyStamps(changedFields, latest as Record<string, unknown>)
    )

    const { data, error } = await supabase
      .from('prescriptions')
      .update(changedFields)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error

    return { success: true, data: data as Prescription }
  } catch (error) {
    console.error('updatePrescriptionReadings failed:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
