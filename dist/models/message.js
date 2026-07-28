"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const supabase_1 = require("../supabase");
const TABLE_NAME = 'spacecommands_messages';
exports.default = {
    async find(filter = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return [];
        let query = client.from(TABLE_NAME).select('*');
        if (filter._id) {
            query = query.eq('id', filter._id);
        }
        const { data, error } = await query;
        if (error) {
            console.error('SpaceCommands > Error fetching messages:', error);
            return [];
        }
        return (data || []).map((row) => ({
            _id: row.id,
            text: row.text,
        }));
    },
    async findOne(filter) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        const { data, error } = await client
            .from(TABLE_NAME)
            .select('*')
            .eq('id', filter._id)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            console.error('SpaceCommands > Error finding message:', error);
            return null;
        }
        return {
            _id: data.id,
            text: data.text,
        };
    },
    async findOneAndUpdate(filter, update, options = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        const id = filter._id;
        const text = update.text || update.$set?.text;
        const { data, error } = await client
            .from(TABLE_NAME)
            .upsert({ id: id, text }, { onConflict: 'id' })
            .select()
            .single();
        if (error) {
            console.error('SpaceCommands > Error upserting message:', error);
            return null;
        }
        return {
            _id: data.id,
            text: data.text,
        };
    },
};
