"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const supabase_1 = require("../supabase");
const TABLE_NAME = 'spacecommands_cooldowns';
exports.default = {
    async find(filter = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return [];
        let query = client.from(TABLE_NAME).select('*');
        // Apply filters
        if (filter._id) {
            query = query.eq('id', filter._id);
        }
        if (filter.name) {
            query = query.eq('name', filter.name);
        }
        if (filter.type) {
            query = query.eq('type', filter.type);
        }
        const { data, error } = await query;
        if (error) {
            console.error('SpaceCommands > Error fetching cooldowns:', error);
            return [];
        }
        return (data || []).map((row) => ({
            _id: row.id,
            name: row.name,
            type: row.type,
            cooldown: row.cooldown,
        }));
    },
    async findOne(filter) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        let query = client.from(TABLE_NAME).select('*');
        if (filter._id) {
            query = query.eq('id', filter._id);
        }
        const { data, error } = await query.single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            console.error('SpaceCommands > Error finding cooldown:', error);
            return null;
        }
        return {
            _id: data.id,
            name: data.name,
            type: data.type,
            cooldown: data.cooldown,
        };
    },
    async findOneAndUpdate(filter, update, options = {}) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return null;
        const id = filter._id;
        const updateData = {};
        if (update.cooldown !== undefined)
            updateData.cooldown = update.cooldown;
        if (update.name !== undefined)
            updateData.name = update.name;
        if (update.type !== undefined)
            updateData.type = update.type;
        if (update.$set) {
            Object.assign(updateData, update.$set);
        }
        const { data, error } = await client
            .from(TABLE_NAME)
            .upsert({ id, ...updateData }, { onConflict: 'id' })
            .select()
            .single();
        if (error) {
            console.error('SpaceCommands > Error upserting cooldown:', error);
            return null;
        }
        return {
            _id: data.id,
            name: data.name,
            type: data.type,
            cooldown: data.cooldown,
        };
    },
    async deleteMany(filter) {
        const client = (0, supabase_1.getSupabaseClient)();
        if (!client)
            return { deletedCount: 0 };
        let query = client.from(TABLE_NAME).delete();
        if (filter.cooldown?.$lte !== undefined) {
            query = query.lte('cooldown', filter.cooldown.$lte);
        }
        const { error, count } = await query;
        if (error) {
            console.error('SpaceCommands > Error deleting cooldowns:', error);
            return { deletedCount: 0 };
        }
        return { deletedCount: count || 0 };
    },
};
