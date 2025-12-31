"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const supabase_1 = require("../supabase");
const TABLE_NAME = 'spacecommands_channel_commands';
exports.default = {
    async find(filter = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return [];
        let query = client.from(TABLE_NAME).select('*');
        if (filter.guildId) {
            query = query.eq('guild_id', filter.guildId);
        }
        if (filter.command) {
            query = query.eq('command', filter.command);
        }
        const { data, error } = await query;
        if (error) {
            console.error('SpaceCommands > Error fetching channel commands:', error);
            return [];
        }
        return (data || []).map((row) => ({
            guildId: row.guild_id,
            command: row.command,
            channels: row.channels,
        }));
    },
    async findOne(filter) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        let query = client.from(TABLE_NAME).select('*');
        if (filter.guildId) {
            query = query.eq('guild_id', filter.guildId);
        }
        if (filter.command) {
            query = query.eq('command', filter.command);
        }
        const { data, error } = await query.single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            console.error('SpaceCommands > Error finding channel command:', error);
            return null;
        }
        return {
            guildId: data.guild_id,
            command: data.command,
            channels: data.channels,
        };
    },
    async findOneAndUpdate(filter, update, options = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        const guildId = filter.guildId;
        const command = filter.command || update.command || update.$set?.command;
        const channels = update.channels || update.$set?.channels;
        const { data, error } = await client
            .from(TABLE_NAME)
            .upsert({ guild_id: guildId, command, channels }, { onConflict: 'guild_id,command' })
            .select()
            .single();
        if (error) {
            console.error('SpaceCommands > Error upserting channel command:', error);
            return null;
        }
        return {
            guildId: data.guild_id,
            command: data.command,
            channels: data.channels,
        };
    },
    async deleteOne(filter) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return { deletedCount: 0 };
        let query = client.from(TABLE_NAME).delete();
        if (filter.guildId) {
            query = query.eq('guild_id', filter.guildId);
        }
        if (filter.command) {
            query = query.eq('command', filter.command);
        }
        const { error } = await query;
        if (error) {
            console.error('SpaceCommands > Error deleting channel command:', error);
            return { deletedCount: 0 };
        }
        return { deletedCount: 1 };
    },
};
