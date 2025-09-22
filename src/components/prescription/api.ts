import { supabase } from '../../SupabaseConfig'
import { v4 as uuidv4 } from 'uuid'

// Define the Prescription type
export interface Prescription {
  id?: string
  patientId?: string
  patientName?: string
  guardianName?: string
  phone?: string
  age?: string | number
  gender?: string
  address?: string
  date?: string
  receiptId?: string
  amount?: string | number
  paymentMethod?: string
  diagnosis?: string
  prescription?: string
  medicine?: string
  rightEye?: string
  leftEye?: string
  eyeNotes?: string
  advice?: string
  PATIENT_NAME?: string
  TYPE?: string
  DATE?: string
  'PATIENT ID'?: string
  'RECEIPT NO'?: string
  'CREATED BY'?: string
  Sno?: string
  [key: string]: unknown
}

// Add a new prescription and receipt
export const addPrescription = async (prescription: Prescription) => {
    try {
      // Generate a unique ID for the prescription
      const prescriptionWithId = { ...prescription, id: uuidv4() }
  
      // Also get the highest Sno from Supabase
      let highestSnoFromSupabase = ''
      try {
        // Get only the Sno values from the database to minimize data transfer
        const { data, error } = await supabase.from('prescriptions').select('Sno')
  
        console.log('Data from Supabase:', data?.length, 'records found')
  
        if (!error && data && data.length > 0) {
          // Find the highest numeric Sno by parsing all values
          // This handles any number of records and ensures we get the true highest value
  
          const SnoIds = data
            .map((p) => p.Sno)
            .filter((id) => /^\d+$/.test(id)) // only numeric strings
            .map((id) => parseInt(id, 10)) // convert to int
  
          if (SnoIds.length === 0) {
            console.log('No valid Sno IDs found.')
            return
          }
          const maxId = Math.max(...SnoIds)
          console.log('Max Sno ID:', maxId)
  
          highestSnoFromSupabase = maxId.toString()
          console.log('Highest numeric Sno found:', highestSnoFromSupabase)
        } else {
          console.log('No prescription records found in Supabase or error occurred')
        }
      } catch (supabaseError) {
        console.error('Error getting highest Sno from Supabase:', supabaseError)
        // Continue with local calculation if Supabase fails
      }
  
      // Add the new prescription with Sno
      let nextSno = 1 // Default to 1 if no previous prescriptions
      let ReceiptNo = ''
  
      if (highestSnoFromSupabase) {
        const parsedSno = parseInt(highestSnoFromSupabase)
        // Check if parsedSno is a valid number
        if (!isNaN(parsedSno)) {
          nextSno = parsedSno + 1
          ReceiptNo = `R${nextSno.toString().padStart(4, '0')}`
          console.log('Next Sno:', nextSno)
        }
      }
  
      const prescriptionWithSno = {
        ...prescriptionWithId,
        Sno: nextSno.toString(), // Convert to string to maintain consistency in storage
        'RECEIPT NO': ReceiptNo
      }
  
      // Add to Supabase
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .insert([prescriptionWithSno])
          .select()
  
        if (error) {
          throw new Error(`Supabase error: ${error.message}`)
        }
  
        console.log('Prescription added to Supabase:', data)
        return {
          success: true,
          data: data[0] || prescriptionWithSno,
          message: 'Prescription added successfully'
        }
      } catch (supabaseError) {
        console.error('Error adding prescription to Supabase:', supabaseError)
        // Continue with local file update even if Supabase fails
        return { success: false, data: null, message: 'Failed to add prescription to Supabase' }
      }
    } catch (error) {
      console.error('Error adding prescription:', error)
      throw error
    }
  }
  