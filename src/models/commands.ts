import { getSupabaseClient } from '../supabase'

export const TABLE_NAME = 'spacecommands_commands'

const commands = {
  find: async (filter: any = {}) => {
    const client = getSupabaseClient()
    if (!client) return []

    let query = client.from(TABLE_NAME).select('*')

    if (filter.name) {
      query = query.eq('name', filter.name)
    }
    if (filter.id) {
      query = query.eq('id', filter.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('SpaceCommands > Error fetching commands:', error)
      return []
    }

    return data
  },

  upsert: async (commandData: any) => {
    const client = getSupabaseClient()
    if (!client) return null

    const { data, error } = await client
      .from(TABLE_NAME)
      .upsert(commandData, { onConflict: 'name' })
      .select()
      .single()

    if (error) {
      console.error('SpaceCommands > Error upserting command:', error)
      return null
    }

    return data
  },

  delete: async (id: any) => {
    const client = getSupabaseClient()
    if (!client) return null

    const { error } = await client
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('SpaceCommands > Error deleting command:', error)
      return null
    }

    return true
  }
}

export default commands
