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

export interface DatabaseError {
  code?: string
  message: string
  details?: string | null
  hint?: string | null
}

export interface DatabaseResult<T = any> {
  data: T | null
  error: DatabaseError | null
  count?: number | null
}

export interface DatabaseQuery<T = any> extends PromiseLike<DatabaseResult<T>> {
  select(columns?: string): DatabaseQuery<T>
  upsert(values: object | object[], options?: { onConflict?: string }): DatabaseQuery<T>
  delete(): DatabaseQuery<T>
  eq(column: string, value: unknown): DatabaseQuery<T>
  lte(column: string, value: unknown): DatabaseQuery<T>
  single(): DatabaseQuery<T>
}

export interface Database {
  from(table: string): DatabaseQuery
}

/** `error.code` of a `.single()` query that matched no row. */
export const NO_ROW = 'PGRST116'

let database: Database | null = null

export const setDatabase = (db: Database | null) => {
  database = db ?? null
}

export const getDatabase = (): Database | null => {
  return database
}
