"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = void 0;
// @ts-nocheck
const supabase_js_1 = require("@supabase/supabase-js");
const Events_1 = __importDefault(require("./enums/Events"));
let supabaseClient = null;
exports.default = async (supabaseUrl, supabaseKey, instance) => {
    supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
    // Test the connection
    const { error } = await supabaseClient.from('spacecommands_prefixes').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
        console.error('SpaceCommands > Supabase connection error:', error);
        instance.emit(Events_1.default.DATABASE_CONNECTED, null, 'Error');
        throw new Error(`Failed to connect to Supabase: ${error.message}`);
    }
    instance.emit(Events_1.default.DATABASE_CONNECTED, supabaseClient, 'Connected');
    return supabaseClient;
};
const getSupabaseClient = () => {
    return supabaseClient;
};
exports.getSupabaseClient = getSupabaseClient;
