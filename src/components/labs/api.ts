import { supabase } from "../../SupabaseConfig"
// Get today's labs
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