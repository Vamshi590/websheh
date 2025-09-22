import { toZonedTime } from 'date-fns-tz'
import { supabase } from '../../SupabaseConfig'
import type { Patient } from '../prescription/ReceiptForm'
import type { InPatient } from '../../pages/Inpatients'
import { v4 as uuidv4 } from 'uuid'



// Get today's patients
export async function getTodaysPatients() {
    try {
      // Get current date in Indian timezone
      const indianTime = toZonedTime(new Date(), 'Asia/Kolkata')
  
      // Create start of day timestamp (00:00:00) in Indian timezone
      const startOfDay = new Date(indianTime)
      startOfDay.setHours(0, 0, 0, 0)
  
      // Create end of day timestamp (23:59:59.999) in Indian timezone
      const endOfDay = new Date(indianTime)
      endOfDay.setHours(23, 59, 59, 999)
  
      // Convert to ISO strings for Supabase query
      const startTimestamp = startOfDay.toISOString()
      const endTimestamp = endOfDay.toISOString()
  
      console.log(`Fetching patients between ${startTimestamp} and ${endTimestamp}`)
  
      // Since the date field may include time information, we need to use LIKE query
      // to match records where the date part starts with today's date
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', startTimestamp)
        .lte('created_at', endTimestamp)
        .order('patientId', { ascending: false })
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      console.log("Today's patients fetched from Supabase successfully")
      return { success: true, data: patients || [], message: "Today's patients fetched successfully" }
    } catch (error) {
      console.error("Error getting today's patients from Supabase:", error)
      return {
        success: false,
        data: [],
        message: `Failed to fetch today's patients: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  // Get patients for a specific date
  export async function getPatientsByDate(dateString: string) {
    try {
      // Parse the date string (format: YYYY-MM-DD)
      const selectedDate = new Date(dateString)
  
      // Create start of day timestamp (00:00:00)
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
  
      // Create end of day timestamp (23:59:59.999)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)
  
      // Convert to ISO strings for Supabase query
      const startTimestamp = startOfDay.toISOString()
      const endTimestamp = endOfDay.toISOString()
  
      console.log(`Fetching patients for ${dateString} between ${startTimestamp} and ${endTimestamp}`)
  
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .gte('created_at', startTimestamp)
        .lte('created_at', endTimestamp)
        .order('patientId', { ascending: false })
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      console.log(`Patients for ${dateString} fetched from Supabase successfully`)
      return {
        success: true,
        data: patients || [],
        message: `Patients for ${dateString} fetched successfully`
      }
    } catch (error) {
      console.error(`Error getting patients for date from Supabase:`, error)
      return {
        success: false,
        data: [],
        message: `Failed to fetch patients: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  // Get patients with pagination
  export async function getPatients(page = 1, pageSize = 10) {
    try {
      // Convert parameters to numbers and ensure they're valid
      const pageNum = Number(page)
      const pageSizeNum = Number(pageSize)
  
      // Calculate range for pagination
      const from = (pageNum - 1) * pageSizeNum
      const to = from + pageSizeNum - 1
  
      // Get total count first
      const { count, error: countError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
  
      if (countError) {
        throw new Error(`Supabase count error: ${countError.message}`)
      }
  
      // Then get paginated data
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')
        .order('date', { ascending: false })
        .range(from, to)
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      const totalCount = count || 0
      const totalPages = Math.ceil(totalCount / pageSizeNum)
  
      console.log(
        `Patients page ${page} fetched from Supabase successfully (${patients?.length || 0} records)`
      )
      return {
        success: true,
        data: patients || [],
        totalCount,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages,
        message: 'Patients fetched successfully'
      }
    } catch (error) {
      console.error('Error getting patients from Supabase:', error)
      return {
        success: false,
        data: [],
        totalCount: 0,
        page,
        pageSize,
        totalPages: 0,
        message: `Failed to fetch patients: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  // Get patient by ID
  export async function getPatientById(patientId: string) {
    try {
      if (!patientId) {
        return { success: false, data: null, message: 'Patient ID is required' }
      }
  
      console.log(`Searching for patient with ID: ${patientId}`)
  
      // First try to find by patientId field
      let { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('patientId', patientId)
        .maybeSingle()
  
      // If not found or error, try by 'PATIENT ID' field (legacy format)
      if ((!patient || error) && patientId) {
        const { data: legacyPatient, error: legacyError } = await supabase
          .from('patients')
          .select('*')
          .eq('PATIENT ID', patientId)
          .maybeSingle()
  
        if (!legacyError && legacyPatient) {
          patient = legacyPatient
          error = null
        }
      }
  
      // If still not found, try by 'id' field
      if ((!patient || error) && patientId) {
        const { data: idPatient, error: idError } = await supabase
          .from('patients')
          .select('*')
          .eq('id', patientId)
          .maybeSingle()
  
        if (!idError && idPatient) {
          patient = idPatient
          error = null
        }
      }
  
      if (error) {
        console.error(`Supabase error searching for patient: ${error.message}`)
        return {
          success: false,
          data: null,
          message: `Database error: ${error.message}`
        }
      }
  
      if (!patient) {
        return {
          success: false,
          data: null,
          message: `No patient found with ID: ${patientId}`
        }
      }
  
      console.log('Patient found:', patient)
      return {
        success: true,
        data: patient,
        message: 'Patient found successfully'
      }
    } catch (error) {
      console.error('Error getting patient by ID:', error)
      return {
        success: false,
        data: null,
        message: `Failed to fetch patient: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  // Get latest patient ID number (more efficient than fetching all patients)
  export async function getLatestPatientId() {
    try {
      // First try Supabase - just get the count
      const { data, error } = await supabase.from('patients').select('patientId')
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
      // Filter and convert to integers
      const patientIds = data
        .map((p) => p.patientId)
        .filter((id) => /^\d+$/.test(id)) // only numeric strings
        .map((id) => parseInt(id, 10)) // convert to int
  
      if (patientIds.length === 0) {
        console.log('No valid patient IDs found.')
        return
      }
      const maxId = Math.max(...patientIds)
      console.log('Max Patient ID:', maxId)
      return { success: true, data: maxId || 0, message: 'Latest patient ID fetched successfully' }
    } catch (error) {
      console.error('Error getting latest patient ID from Supabase:', error)
      return {
        success: false,
        data: 0,
        message: `Failed to fetch latest patient ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  export async function getLatestInPatientId() {
    try {
      // First try Supabase - just get the count
      const { data, error } = await supabase.from('inpatients').select('id')
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
      if (data.length === 0) {
        console.log('No valid patient IDs found.')
        return
      }
      const maxId = Math.max(...data.map((item) => item.id))
      console.log('Max Patient ID:', maxId)
      return { success: true, data: maxId || 0, message: 'Latest patient ID fetched successfully' }
    } catch (error) {
      console.error('Error getting latest patient ID from Supabase:', error)
      return {
        success: false,
        data: 0,
        message: `Failed to fetch latest patient ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  // Add a new patient
  export async function addPatient(patient: Omit<Patient, 'id'>) {
    try {
      // Validate required patient data
      if (!patient || !patient.patientId || !patient.name) {
        return { success: false, data: null, message: 'Missing required patient information' }
      }
  
      // Generate a unique ID for the patient
      const patientWithId = { ...patient, id: uuidv4() }
  
      // Add the patient to Supabase
      const { data, error } = await supabase.from('patients').insert([patientWithId]).select()
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      if (!data || data.length === 0) {
        throw new Error('Patient was not added to the database')
      }
  
      console.log('Patient added to Supabase:', data)
      return { success: true, data: patientWithId, message: 'Patient added successfully' }
    } catch (error) {
      console.error('Error adding patient:', error)
      return {
        success: false,
        data: null,
        message: `Failed to add patient: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  // Update an existing patient
export async function updatePatient(id: string, updatedPatient: Omit<Patient, 'id'>) {
    try {
      // Validate input parameters
      if (!id) {
        return { success: false, data: null, message: 'Patient ID is required for update' }
      }
  
      if (!updatedPatient) {
        return { success: false, data: null, message: 'Updated patient data is required' }
      }
  
      // Update patient in Supabase
      const { data, error } = await supabase
        .from('patients')
        .update(updatedPatient)
        .eq('id', id)
        .select()
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      if (!data || data.length === 0) {
        throw new Error(`Patient with ID ${id} not found or not updated`)
      }
  
      console.log('Patient updated in Supabase:', data)
      return { success: true, data: data[0], message: 'Patient updated successfully' }
    } catch (error) {
      console.error('Error updating patient:', error)
      return {
        success: false,
        data: null,
        message: `Failed to update patient: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  // Delete a patient
export async function deletePatient(id: string) {
    try {
      // Validate input parameter
      if (!id) {
        return { success: false, message: 'Patient ID is required for deletion' }
      }
  
      // Check if patient exists before deletion
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .eq('id', id)
        .single()
  
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is the error code when no rows returned
        throw new Error(`Error checking patient existence: ${checkError.message}`)
      }
  
      if (!existingPatient) {
        return { success: false, message: `Patient with ID ${id} not found` }
      }
  
      // Delete patient from Supabase
      const { error } = await supabase.from('patients').delete().eq('id', id)
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      console.log('Patient deleted from Supabase successfully')
      return { success: true, message: 'Patient deleted successfully' }
    } catch (error) {
      console.error('Error deleting patient from Supabase:', error)
      return {
        success: false,
        message: `Failed to delete patient: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  // Get all operations
  
  // In-Patient Management
  export async function getInPatients() {
    try {
      const { data, error } = await supabase
        .from('inpatients')
        .select('*')
        .order('date', { ascending: false })
  
      if (error) {
        console.error('Error fetching in-patients:', error)
        return { success: false, message: 'Failed to fetch in-patients', error }
      }
  
      return { success: true, data }
    } catch (error) {
      console.error('Error in getInPatients:', error)
      return { success: false, message: 'An error occurred while fetching in-patients', error }
    }
  }
  
  export async function getLatestinPatientId() {
    try {
      const { data, error } = await supabase
        .from('inpatients')
        .select('patientId')
        .order('created_at', { ascending: false })
        .limit(1)
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      const latestId = data && data.length > 0 ? data[0].patientId : null
      return { success: true, data: { latestId } }
    } catch (error) {
      console.error('Error fetching latest patient ID:', error)
      return {
        success: false,
        message: `Failed to fetch latest patient ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  export async function addInPatient(inpatientData: Omit<InPatient, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('inpatients')
        .insert([
          {
            ...inpatientData,
            created_at: new Date().toISOString()
          }
        ])
        .select()
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      return { success: true, data: data?.[0] || null }
    } catch (error) {
      console.error('Error adding in-patient:', error)
      return {
        success: false,
        message: `Failed to add in-patient record: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
//   export async function updateInPatient(id: any, inpatientData: any) {
//     try {
//       console.log('updateInPatient id:', id)
//       console.log('updateInPatient inpatientData:', inpatientData)
  
//       // Validate parameters
//       if (!id) {
//         throw new Error('Missing required parameter: id')
//       }
  
//       // Log the validated parameters
//       console.log('Processing update for inpatient ID:', id)
  
//       const { data, error } = await supabase
//         .from('inpatients')
//         .update({
//           operationDetails: id.inpatientData.operationDetails,
//           operationProcedure: id.inpatientData.operationProcedure,
//           provisionDiagnosis: id.inpatientData.provisionDiagnosis,
//           prescriptions: id.inpatientData.prescriptions,
//           followUpDate: id.inpatientData.followUpDate,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', id.id)
//         .select()
  
//       if (error) {
//         throw new Error(`Supabase error: ${error.message}`)
//       }
  
//       return { success: true, data: data?.[0] || null }
//     } catch (error) {
//       console.error('Error updating in-patient:', error)
//       return {
//         success: false,
//         message: `Failed to update in-patient record: ${error instanceof Error ? error.message : 'Unknown error'}`
//       }
//     }
//   }
  
  // Update all fields of an in-patient record
  export async function updateInPatientAll(params: { id: string; inpatientData: Omit<InPatient, 'id'> }) {
    try {
      console.log('updateInPatientAll params:', params)
  
      // Validate parameters
      if (!params || !params.id) {
        throw new Error('Missing required parameter: id')
      }
  
      const { id, inpatientData } = params
      const rid = id
      console.log('updateInPatientAll rid:', rid)
      // Log the validated parameters
      console.log('Processing full update for inpatient ID:', id)
      console.log('Update data:', inpatientData)
  
      // Create an update object with all fields from inpatientData
      const updateData = {
        // Patient information
        name: inpatientData.name,
        patientId: inpatientData.patientId,
        age: inpatientData.age,
        gender: inpatientData.gender,
        guardianName: inpatientData.guardianName,
        phone: inpatientData.phone,
        address: inpatientData.address,
        date: inpatientData.date,
        admissionDate: inpatientData.admissionDate,
        doctorNames: inpatientData.doctorNames,
        onDutyDoctor: inpatientData.onDutyDoctor,
        referredBy: inpatientData.referredBy,
        // Operation details
        operationName: inpatientData.operationName,
        operationDetails: inpatientData.operationDetails,
        operationProcedure: inpatientData.operationProcedure,
        provisionDiagnosis: inpatientData.provisionDiagnosis,
        prescriptions: inpatientData.prescriptions,
        followUpDate: inpatientData.followUpDate,
  
        // Financial information
        packageAmount: inpatientData.packageAmount,
        packageInclusions: inpatientData.packageInclusions,
        discount: inpatientData.discount,
        netAmount: inpatientData.netAmount,
        paymentRecords: inpatientData.paymentRecords,
        totalReceivedAmount: inpatientData.totalReceivedAmount,
        balanceAmount: inpatientData.balanceAmount,
  
        // Metadata
        updated_at: new Date().toISOString()
      }
  
      const { data, error } = await supabase
        .from('inpatients')
        .update(updateData)
        .eq('id', rid)
        .select()
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      return { success: true, data: data?.[0] || null }
    } catch (error) {
      console.error('Error updating in-patient (full update):', error)
      return {
        success: false,
        message: `Failed to update in-patient record: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  export async function deleteInPatient(id: string) {
    try {
      const { error } = await supabase.from('inpatients').delete().eq('id', id)
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      return { success: true }
    } catch (error) {
      console.error('Error deleting in-patient:', error)
      return {
        success: false,
        message: `Failed to delete in-patient record: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  
  export async function getInPatientById(id: string) {
    try {
      const { data, error } = await supabase.from('inpatients').select('*').eq('id', id).single()
  
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
  
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching in-patient by ID:', error)
      return {
        success: false,
        message: `Failed to fetch in-patient record: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
  