"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = exports.initSupabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
let supabase = null;
const initSupabase = (url, key) => {
    if (!url || !key) {
        console.warn('SpaceCommands > Supabase URL or Key not provided.');
        return;
    }
    supabase = (0, supabase_js_1.createClient)(url, key);
};
exports.initSupabase = initSupabase;
const getSupabaseClient = () => {
    return supabase;
};
exports.getSupabaseClient = getSupabaseClient;
