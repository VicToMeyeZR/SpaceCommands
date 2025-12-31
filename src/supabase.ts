// @ts-nocheck
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import SpaceCommands from '.'
import Events from './enums/Events'

let supabaseClient: SupabaseClient | null = null

export interface Database {
  public: {
    Tables: {
      spacecommands_prefixes: {
        Row: {
          guild_id: string
          prefix: string
          created_at?: string
        }
        Insert: {
          guild_id: string
          prefix: string
          created_at?: string
        }
        Update: {
          guild_id?: string
          prefix?: string
          created_at?: string
        }
      }
      spacecommands_cooldowns: {
        Row: {
          id: string
          name: string
          type: string
          cooldown: number
          created_at?: string
        }
        Insert: {
          id: string
          name: string
          type: string
          cooldown: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          cooldown?: number
          created_at?: string
        }
      }
      spacecommands_languages: {
        Row: {
          guild_id: string
          language: string
          created_at?: string
        }
        Insert: {
          guild_id: string
          language: string
          created_at?: string
        }
        Update: {
          guild_id?: string
          language?: string
          created_at?: string
        }
      }
      spacecommands_disabled_commands: {
        Row: {
          id: number
          guild_id: string
          command: string
          created_at?: string
        }
        Insert: {
          guild_id: string
          command: string
          created_at?: string
        }
        Update: {
          guild_id?: string
          command?: string
          created_at?: string
        }
      }
      spacecommands_channel_commands: {
        Row: {
          id: number
          guild_id: string
          command: string
          channels: string[]
          created_at?: string
        }
        Insert: {
          guild_id: string
          command: string
          channels: string[]
          created_at?: string
        }
        Update: {
          guild_id?: string
          command?: string
          channels?: string[]
          created_at?: string
        }
      }
      spacecommands_required_roles: {
        Row: {
          id: number
          guild_id: string
          command: string
          required_roles: string[]
          created_at?: string
        }
        Insert: {
          guild_id: string
          command: string
          required_roles: string[]
          created_at?: string
        }
        Update: {
          guild_id?: string
          command?: string
          required_roles?: string[]
          created_at?: string
        }
      }
    }
  }
}

export default async (
  supabaseUrl: string,
  supabaseKey: string,
  instance: SpaceCommands
) => {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey)

  // Test the connection
  const { error } = await supabaseClient.from('spacecommands_prefixes').select('count').limit(1)

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
    console.error('SpaceCommands > Supabase connection error:', error)
    instance.emit(Events.DATABASE_CONNECTED, null, 'Error')
    throw new Error(`Failed to connect to Supabase: ${error.message}`)
  }

  instance.emit(Events.DATABASE_CONNECTED, supabaseClient, 'Connected')

  return supabaseClient
}

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  return supabaseClient
}
