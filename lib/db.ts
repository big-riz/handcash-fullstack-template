import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set")
}

if (process.env.NODE_ENV === 'development') {
    try {
        const hostname = new URL(process.env.DATABASE_URL).hostname
        if (!hostname.includes('-pooler')) {
            console.warn('[DB] WARNING: DATABASE_URL hostname does not contain "-pooler". Use the pooled connection string for better performance.')
        }
    } catch {}
}

// Create Neon HTTP client
const sql = neon(process.env.DATABASE_URL)

// Create Drizzle ORM instance
export const db = drizzle(sql, {
    schema,
    logger: process.env.NODE_ENV === 'development' ? {
        logQuery(query: string, params: unknown[]) {
            console.log(`[DB] ${query.substring(0, 200)}`, params?.length ? `(${params.length} params)` : '')
        }
    } : undefined
})

// Export schema for convenience
export { schema }
