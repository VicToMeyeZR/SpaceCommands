"use strict";
/**
 * The database SpaceCommands stores its settings in.
 *
 * SpaceCommands does not know or care which database this is. The application
 * passes in any object that implements `Database` (the `database` option), and
 * the models in ./models talk to that interface only.
 *
 * What an implementation must provide:
 *
 *   database.from(table)
 *     .select(columns?)            read rows
 *     .upsert(row, { onConflict }) insert, or update the row that conflicts
 *                                  on the comma-separated `onConflict` columns
 *     .delete()                    delete the filtered rows
 *     .eq(column, value)           filter: column equals value
 *     .lte(column, value)          filter: column is less than or equal to value
 *     .single()                    resolve to one row object instead of an array
 *
 *   Every chain is awaitable and resolves to `{ data, error }`; it never
 *   rejects. `error` is null on success, otherwise `{ code, message }`.
 *   `.single()` with no matching row resolves with `error.code === NO_ROW`.
 *
 * The tables are created by schema.sql in the package root.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = exports.setDatabase = exports.NO_ROW = void 0;
/** `error.code` of a `.single()` query that matched no row. */
exports.NO_ROW = 'PGRST116';
let database = null;
const setDatabase = (db) => {
    database = db ?? null;
};
exports.setDatabase = setDatabase;
const getDatabase = () => {
    return database;
};
exports.getDatabase = getDatabase;
