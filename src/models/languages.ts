// @ts-nocheck
import { getDatabase, NO_ROW } from '../database'

const TABLE_NAME = 'spacecommands_languages'

export default {
  async find(filter: any = {}) {
    const client = getDatabase()
    if (!client) return []

    let query = client.from(TABLE_NAME).select('*')

    if (filter._id) {
      query = query.eq('guild_id', filter._id)
    }

    const { data, error } = await query

    if (error) {
      console.error('SpaceCommands > Error fetching languages:', error)
      return []
    }

    return (data || []).map((row) => ({
      _id: row.guild_id,
      language: row.language,
    }))
  },

  async findOne(filter: any) {
    const client = getDatabase()
    if (!client) return null

    const { data, error } = await client
      .from(TABLE_NAME)
      .select('*')
      .eq('guild_id', filter._id)
      .single()

    if (error) {
      if (error.code === NO_ROW) return null
      console.error('SpaceCommands > Error finding language:', error)
      return null
    }

    return {
      _id: data.guild_id,
      language: data.language,
    }
  },

  async findOneAndUpdate(filter: any, update: any, options: any = {}) {
    const client = getDatabase()
    if (!client) return null

    const guildId = filter._id
    const language = update.language || update.$set?.language

    const { data, error } = await client
      .from(TABLE_NAME)
      .upsert(
        { guild_id: guildId, language },
        { onConflict: 'guild_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('SpaceCommands > Error upserting language:', error)
      return null
    }

    return {
      _id: data.guild_id,
      language: data.language,
    }
  },
}
