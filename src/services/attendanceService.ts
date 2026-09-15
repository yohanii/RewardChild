import { supabase } from '@/src/services/supabaseClient'

export async function claimDailyAttendance() {
  const { data, error } = await supabase.rpc('claim_daily_attendance')

  if (error) throw error

  return data
}

