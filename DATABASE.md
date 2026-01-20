# Database Setup

This project uses [Neon](https://neon.tech) PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/) for database management.

## Database Tables

### Core Tables (Migrated from File Storage)

- **`payments`** - Payment transaction records
- **`collections`** - NFT/item collections
- **`item_templates`** - Minting templates
- **`audit_logs`** - Security and audit events

### Extensibility Tables (New)

- **`users`** - Cached HandCash user data and preferences
- **`minted_items`** - Complete history of all minted items
- **`sessions`** - Server-side session management (future use)
- **`rate_limits`** - Distributed rate limiting (future use)

## Environment Variables

Add your Neon database connection string to `.env.local`:

```env
DATABASE_URL=postgres://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Database Scripts

```bash
# Push schema changes to database (development)
npm run db:push

# Generate migration files (production)
npm run db:generate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Schema Management

The database schema is defined in `lib/schema.ts` using Drizzle ORM. All tables use:
- **Text IDs** for primary keys (compatible with HandCash IDs)
- **JSONB** for flexible metadata storage
- **Timestamps** with automatic defaults
- **Foreign keys** with cascade deletes where appropriate

## Storage Modules

Each table has a corresponding storage module in `lib/`:

- `payments-storage.ts` - Payment operations
- `collections-storage.ts` - Collection CRUD
- `item-templates-storage.ts` - Template management
- `audit-storage.ts` - Audit logging
- `users-storage.ts` - User data caching
- `minted-items-storage.ts` - Mint tracking

## Migration from File Storage

The following files were migrated from JSON file storage to database:

- `data/payments.json` → `payments` table
- `data/collections.json` → `collections` table
- `data/item-templates.json` → `item_templates` table
- `data/audit.log` → `audit_logs` table

**Note:** The old `data/` directory files are no longer used and can be safely deleted.

## Database Connection

The database connection is configured in `lib/db.ts` using the Neon serverless driver:

```typescript
import { db } from "@/lib/db"
import { users } from "@/lib/schema"

// Example query
const allUsers = await db.select().from(users)
```

## Indexes

The following indexes are created for performance:

- `payments.payment_request_id` - Fast payment lookups
- `payments.paid_at` - Sorted payment history
- `audit_logs.timestamp` - Chronological audit logs
- `audit_logs.user_id` - User-specific audits
- `minted_items.minted_to_user_id` - User inventory
- `minted_items.collection_id` - Collection analytics

## Production Considerations

1. **Connection Pooling**: Neon serverless driver handles pooling automatically
2. **Migrations**: Use `npm run db:generate` to create migration files for production
3. **Backups**: Neon provides automatic backups (check your plan)
4. **Monitoring**: Use Neon dashboard for query performance and connection monitoring

## Troubleshooting

### Connection Issues

If you see connection errors:

1. Verify `DATABASE_URL` is set correctly in `.env.local`
2. Check that your Neon project is active
3. Ensure SSL mode is enabled (`?sslmode=require`)

### Schema Sync Issues

If schema changes aren't applying:

```bash
# Force push schema (development only)
npm run db:push

# Or generate and apply migrations (production)
npm run db:generate
npx drizzle-kit migrate
```

### Query Errors

Enable query logging by setting in `.env.local`:

```env
DRIZZLE_LOG=true
```
