import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export const initSupabase = (url: string, key: string) => {
  if (!url || !key) {
    console.warn('SpaceCommands > Supabase URL or Key not provided.')
    return
  }
  supabase = createClient(url, key)
}

export const getSupabaseClient = () => {
  return supabase
}
