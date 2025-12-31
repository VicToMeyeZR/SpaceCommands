"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const supabase_1 = require("../supabase");
const TABLE_NAME = 'spacecommands_prefixes';
exports.default = {
    async find(filter = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return [];
        let query = client.from(TABLE_NAME).select('*');
        // Apply filters if provided
        if (filter._id) {
            query = query.eq('guild_id', filter._id);
        }
        const { data, error } = await query;
        if (error) {
            console.error('SpaceCommands > Error fetching prefixes:', error);
            return [];
        }
        // Transform to match Mongoose format
        return (data || []).map((row) => ({
            _id: row.guild_id,
            prefix: row.prefix,
        }));
    },
    async findOne(filter) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        const { data, error } = await client
            .from(TABLE_NAME)
            .select('*')
            .eq('guild_id', filter._id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // No rows found
            console.error('SpaceCommands > Error finding prefix:', error);
            return null;
        }
        return {
            _id: data.guild_id,
            prefix: data.prefix,
        };
    },
    async findOneAndUpdate(filter, update, options = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        const guildId = filter._id;
        const prefix = update.prefix || update.$set?.prefix;
        const { data, error } = await client
            .from(TABLE_NAME)
            .upsert({ guild_id: guildId, prefix }, { onConflict: 'guild_id' })
            .select()
            .single();
        if (error) {
            console.error('SpaceCommands > Error upserting prefix:', error);
            return null;
        }
        return {
            _id: data.guild_id,
            prefix: data.prefix,
        };
    },
    async deleteOne(filter) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return { deletedCount: 0 };
        const { error } = await client
            .from(TABLE_NAME)
            .delete()
            .eq('guild_id', filter._id);
        if (error) {
            console.error('SpaceCommands > Error deleting prefix:', error);
            return { deletedCount: 0 };
        }
        return { deletedCount: 1 };
    },
};
