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
    if (filter.commandId) {
      query = query.eq('command_id', filter.commandId)
    }

    const { data, error } = await query

    if (error) {
      console.error('SpaceCommands > Error fetching required roles:', error)
      return []
    }

    return (data || []).map((row) => ({
      guildId: row.guild_id,
      commandId: row.command_id,
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
    if (filter.commandId) {
      query = query.eq('command_id', filter.commandId)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('SpaceCommands > Error finding required roles:', error)
      return null
    }

    return {
      guildId: data.guild_id,
      commandId: data.command_id,
      requiredRoles: data.required_roles,
    }
  },

  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    const client = getSupabaseClient()
    if (!client) return null

    const guildId = filter.guildId
    const commandId = filter.commandId || update.commandId || update.$set?.commandId
    let requiredRoles = update.requiredRoles || update.$set?.requiredRoles

    // Handle $addToSet (used by requiredrole command)
    if (update.$addToSet && update.$addToSet.requiredRoles) {
      const roleToAdd = update.$addToSet.requiredRoles

      // Fetch existing roles first
      const { data: existing } = await client
        .from(TABLE_NAME)
        .select('required_roles')
        .eq('guild_id', guildId)
        .eq('command_id', commandId)
        .single()

      const currentRoles = existing ? existing.required_roles || [] : []
      // Ensure it's an array
      const rolesArray = Array.isArray(currentRoles) ? currentRoles : []

      if (!rolesArray.includes(roleToAdd)) {
        rolesArray.push(roleToAdd)
      }

      requiredRoles = rolesArray
    }

    const { data, error } = await client
      .from(TABLE_NAME)
      .upsert(
        { guild_id: guildId, command_id: commandId, required_roles: requiredRoles },
        { onConflict: 'guild_id,command_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('SpaceCommands > Error upserting required roles:', error)
      return null
    }

    return {
      guildId: data.guild_id,
      commandId: data.command_id,
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
    // DELIBERATE DEVIATION from published 3.7.2, which still filters on
    // `filter.command` here while every other method uses commandId. Its only caller —
    // the `roleId === 'none'` branch of commands/requiredrole.ts — passes
    // { guildId, commandId }, so `filter.command` was always undefined and the delete
    // ran with the GUILD FILTER ALONE: clearing one command's required roles wiped
    // EVERY command's rows for that guild, while the reply claimed it had cleared only
    // the named command. Role-gated commands silently lost their gates.
    if (filter.commandId) {
      query = query.eq('command_id', filter.commandId)
    }

    const { error } = await query

    if (error) {
      console.error('SpaceCommands > Error deleting required roles:', error)
      return { deletedCount: 0 }
    }

    return { deletedCount: 1 }
  },
}
