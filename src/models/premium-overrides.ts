// @ts-nocheck
import { getDatabase, NO_ROW } from '../database'

const TABLE_NAME = 'spacecommands_premium_overrides'

export default {
  /**
   * Find overrides for a specific guild
   */
  async findOne(guildId: any) {
    const client = getDatabase()
    if (!client) return null

    const { data, error } = await client
      .from(TABLE_NAME)
      .select('sku_id')
      .eq('guild_id', guildId)
      .single()

    if (error) {
      if (error.code === NO_ROW) return null
      console.error('SpaceCommands > Error finding premium override:', error)
      return null
    }

    return {
      guildId,
      skuId: data.sku_id,
    }
  },

  /**
   * Set overrides for a guild
   */
  async setOverride(guildId: any, skuId: any) {
    const client = getDatabase()
    if (!client) return null

    const { data, error } = await client
      .from(TABLE_NAME)
      .upsert({ guild_id: guildId, sku_id: skuId }, { onConflict: 'guild_id' })
      .select()
      .single()

    if (error) {
      console.error('SpaceCommands > Error setting premium override:', error)
      return null
    }

    return {
      guildId: data.guild_id,
      skuId: data.sku_id,
    }
  },

  /**
   * Remove overrides for a guild
   */
  async removeOverrides(guildId: any) {
    const client = getDatabase()
    if (!client) return false

    const { error } = await client
      .from(TABLE_NAME)
      .delete()
      .eq('guild_id', guildId)

    if (error) {
      console.error('SpaceCommands > Error removing premium override:', error)
      return false
    }

    return true
  }
}
