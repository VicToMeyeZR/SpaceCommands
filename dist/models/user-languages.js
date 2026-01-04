"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const supabase_1 = require("../supabase");
const TABLE_NAME = 'spacecommands_user_languages';
exports.default = {
    async find(filter = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return [];
        let query = client.from(TABLE_NAME).select('*');
        if (filter._id) {
            query = query.eq('user_id', filter._id);
        }
        const { data, error } = await query;
        if (error) {
            console.error('SpaceCommands > Error fetching user languages:', error);
            return [];
        }
        return (data || []).map((row) => ({
            _id: row.user_id,
            language: row.language,
        }));
    },
    async findOne(filter) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        const { data, error } = await client
            .from(TABLE_NAME)
            .select('*')
            .eq('user_id', filter._id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            console.error('SpaceCommands > Error finding user language:', error);
            return null;
        }
        return {
            _id: data.user_id,
            language: data.language,
        };
    },
    async findOneAndUpdate(filter, update, options = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        const userId = filter._id;
        const language = update.language || update.$set?.language;
        const { data, error } = await client
            .from(TABLE_NAME)
            .upsert({ user_id: userId, language }, { onConflict: 'user_id' })
            .select()
            .single();
        if (error) {
            console.error('SpaceCommands > Error upserting user language:', error);
            return null;
        }
        return {
            _id: data.user_id,
            language: data.language,
        };
    },
};
