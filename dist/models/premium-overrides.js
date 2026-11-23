"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const database_1 = require("../database");
const TABLE_NAME = 'spacecommands_premium_overrides';
exports.default = {
    /**
     * Find overrides for a specific guild
     */
    async findOne(guildId) {
        const client = (0, database_1.getDatabase)();
        if (!client)
            return null;
        const { data, error } = await client
            .from(TABLE_NAME)
            .select('sku_id')
            .eq('guild_id', guildId)
            .single();
        if (error) {
            if (error.code === database_1.NO_ROW)
                return null;
            console.error('SpaceCommands > Error finding premium override:', error);
            return null;
        }
        return {
            guildId,
            skuId: data.sku_id,
        };
    },
    /**
     * Set overrides for a guild
     */
    async setOverride(guildId, skuId) {
        const client = (0, database_1.getDatabase)();
        if (!client)
            return null;
        const { data, error } = await client
            .from(TABLE_NAME)
            .upsert({ guild_id: guildId, sku_id: skuId }, { onConflict: 'guild_id' })
            .select()
            .single();
        if (error) {
            console.error('SpaceCommands > Error setting premium override:', error);
            return null;
        }
        return {
            guildId: data.guild_id,
            skuId: data.sku_id,
        };
    },
    /**
     * Remove overrides for a guild
     */
    async removeOverrides(guildId) {
        const client = (0, database_1.getDatabase)();
        if (!client)
            return false;
        const { error } = await client
            .from(TABLE_NAME)
            .delete()
            .eq('guild_id', guildId);
        if (error) {
            console.error('SpaceCommands > Error removing premium override:', error);
            return false;
        }
        return true;
    }
};
