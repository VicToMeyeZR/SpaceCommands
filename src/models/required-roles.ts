// @ts-nocheck
import { getSupabaseClient } from '../supabase'

const TABLE_NAME = 'spacecommands_required_roles'

export default {
  async find(filter: any = {}) {
    const client = getSupabaseClient()
    if (!client) return []

    let query = client.from(TABLE_NAME).select('*')

    if (filter.guildId) {
      query = query.eq('guild_id', filter.guildId)
    }
    if (filter.command) {
      query = query.eq('command', filter.command)
    }

    const { data, error } = await query

    if (error) {
      console.error('SpaceCommands > Error fetching required roles:', error)
      return []
    }

    return (data || []).map((row) => ({
      guildId: row.guild_id,
      command: row.command,
      requiredRoles: row.required_roles,
    }))
  },

  async findOne(filter: any) {
    const client = getSupabaseClient()
    if (!client) return null

    let query = client.from(TABLE_NAME).select('*')

    if (filter.guildId) {
      query = query.eq('guild_id', filter.guildId)
    }
    if (filter.command) {
      query = query.eq('command', filter.command)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('SpaceCommands > Error finding required roles:', error)
      return null
    }

    return {
      guildId: data.guild_id,
      command: data.command,
      requiredRoles: data.required_roles,
    }
  },

  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    const client = getSupabaseClient()
    if (!client) return null

    const guildId = filter.guildId
    const command = filter.command || update.command || update.$set?.command
    const requiredRoles = update.requiredRoles || update.$set?.requiredRoles

    const { data, error } = await client
      .from(TABLE_NAME)
      .upsert(
        { guild_id: guildId, command, required_roles: requiredRoles },
        { onConflict: 'guild_id,command' }
      )
      .select()
      .single()

    if (error) {
      console.error('SpaceCommands > Error upserting required roles:', error)
      return null
    }

    return {
      guildId: data.guild_id,
      command: data.command,
      requiredRoles: data.required_roles,
    }
  },

  async deleteOne(filter: any) {
    const client = getSupabaseClient()
    if (!client) return { deletedCount: 0 }

    let query = client.from(TABLE_NAME).delete()

    if (filter.guildId) {
      query = query.eq('guild_id', filter.guildId)
    }
    if (filter.command) {
      query = query.eq('command', filter.command)
    }

    const { error } = await query

    if (error) {
      console.error('SpaceCommands > Error deleting required roles:', error)
      return { deletedCount: 0 }
    }

    return { deletedCount: 1 }
  },
}
