import { supabase } from "../../SupabaseConfig"
// Get today's labs
import { v4 as uuidv4 } from 'uuid'

// Define Lab interface
interface Lab {
  id: string
  [key: string]: unknown
}
export const getTodaysLabs = async () => {
    try {
      // Get today's date in YYYY-MM-DD format
      const todayDate = new Date().toISOString().split('T')[0]
  
      const { data: labs, error } = await supabase.from('labs').select('*').eq('DATE', todayDate)
  
      if (!error && labs) {
        console.log("Today's labs fetched from Supabase successfully")
        return {
          success: true,
          data: labs,
          error: null,
          statusCode: 200
        }
      } else {
        console.log("Today's labs fetched from Supabase failed", error)
        return {
          success: false,
          data: [],
          error: error?.message || "Failed to fetch today's labs",
          statusCode: 400
        }
      }
    } catch (error) {
      console.error("Error getting today's labs:", error)
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        statusCode: 500
      }
    }
  }

// Add a new lab
export const addLab = async (labData: Omit<Lab, 'id'>) => {
  try {
    // Generate a unique ID for the new lab
    const newLab = {
      id: uuidv4(),
      ...labData
    }

    const { data, error } = await supabase.from('labs').insert(newLab).select()

    if (!error && data) {
      console.log('Lab added to Supabase successfully')
      return {
        success: true,
        data: data[0],
        error: null,
        statusCode: 201
      }
    } else {
      console.log('Lab added to Supabase failed', error)
      return {
        success: false,
        data: null,
        error: error?.message || 'Failed to add lab',
        statusCode: 400
      }
    }
  } catch (error) {
    console.error('Error adding lab:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 500
    }
  }
}


// Update an existing lab
export const updateLab = async (labData: Lab) => {
  try {
    const { id } = labData

    console.log('Lab', labData)

    const { data, error } = await supabase.from('labs').update(labData).eq('id', id).select()

    if (!error && data) {
      console.log('Lab updated in Supabase successfully')
      return {
        success: true,
        data: data[0],
        error: null,
        statusCode: 200
      }
    } else {
      console.log('Lab updated in Supabase failed', error)
      return {
        success: false,
        data: null,
        error: error?.message || 'Failed to update lab',
        statusCode: 400
      }
    }
  } catch (error) {
    console.error('Error updating lab:', error)
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 500
    }
  }
}
// Delete a lab
export const deleteLab = async (id: string) => {
  try {
    // Try to delete lab from Supabase first
    const { error } = await supabase.from('labs').delete().eq('id', id)

    if (!error) {
      console.log('Lab deleted from Supabase successfully')
      return {
        success: true,
        data: true,
        error: null,
        statusCode: 200
      }
    } else {
      console.log('Lab deleted from Supabase failed', error)
      return {
        success: false,
        data: false,
        error: error?.message || 'Failed to delete lab',
        statusCode: 400
      }
    }
  } catch (error) {
    console.error('Error deleting lab:', error)
    return {
      success: false,
      data: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 500
    }
  }
}

// Search labs by patient ID
export const searchLabs = async (patientId: string) => {
  try {
    const { data: labs, error } = await supabase
      .from('labs')
      .select('*')
      .eq('PATIENT ID', patientId)
      .order('DATE', { ascending: false })

    if (!error && labs) {
      console.log('Labs searched in Supabase successfully')
      return {
        success: true,
        data: labs,
        error: null,
        statusCode: 200
      }
    } else {
      console.log('Labs searched in Supabase failed', error)
      return {
        success: false,
        data: [],
        error: error?.message || 'Failed to search labs',
        statusCode: 400
      }
    }
  } catch (error) {
    console.error('Error searching labs:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 500
    }
  }
}


// Get all labs
export const getLabs = async () => {
  try {
    const { data: labs, error } = await supabase
      .from('labs')
      .select('*')
      .order('DATE', { ascending: false })

    if (!error && labs) {
      console.log('Labs fetched from Supabase successfully')
      return {
        success: true,
        data: labs,
        error: null,
        statusCode: 200
      }
    }
    return {
      success: false,
      data: [],
      error: error?.message || 'Failed to fetch labs',
      statusCode: 400
    }
  } catch (error) {
    console.error('Error getting labs:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: 500
    }
  }
}