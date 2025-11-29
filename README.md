# @qcksys/drizzle-extensions

Utility functions for Drizzle ORM to simplify upsert operations and live queries.

## Installation

```bash
pnpm add @qcksys/drizzle-extensions
```

## Usage

### onDuplicateKeyUpdate (MySQL, SingleStore)

By default, it will update all columns except the primary key and unique indexes.
You can explicitly specify which columns to keep or exclude.

Composite primary/unique keys are not automatically detected so will need to be specified in the "excludes" option.

```ts
import { db } from "@/db/drizzle";
import { tTable1 } from "@/db/schema";
import {
  onDuplicateKeyUpdateConfig,
  onDuplicateKeyUpdateSet,
} from "@qcksys/drizzle-extensions";

// Simple usage - updates all non-pk/unique columns on conflict
await db
  .insert(tTable1)
  .values({
    id: 1,
    name: "qcksys",
    deleted: false,
    testing: true,
  })
  .onDuplicateKeyUpdate(
    // If `id` is the pk and `name` has a unique index
    // it will update all columns except `id` and `name`.
    onDuplicateKeyUpdateConfig(tTable1)
  );

// Keep only specific columns for update
await db
  .insert(tTable1)
  .values({
    id: 1,
    name: "qcksys",
    deleted: false,
    testing: true,
  })
  .onDuplicateKeyUpdate(
    // This would target just the `deleted` column for updates.
    onDuplicateKeyUpdateConfig(tTable1, { keep: tTable1.deleted })
  );

// Exclude specific columns from update
await db
  .insert(tTable1)
  .values({
    id: 1,
    name: "qcksys",
    deleted: false,
    testing: true,
  })
  .onDuplicateKeyUpdate(
    // Updates all columns except pk, unique, and `testing`
    onDuplicateKeyUpdateConfig(tTable1, { exclude: [tTable1.testing] })
  );

// Use set directly for more control
await db
  .insert(tTable1)
  .values({ id: 1, name: "qcksys", deleted: false })
  .onDuplicateKeyUpdate({
    set: onDuplicateKeyUpdateSet(tTable1, { keep: [tTable1.deleted] }),
  });
```

### onConflictDoUpdate (PostgreSQL, SQLite)

Composite primary/unique keys are not automatically detected, so will need to be specified in the "target" option.

```ts
import { db } from "@/db/drizzle";
import { tTable1 } from "@/db/schema";
import {
  onConflictDoUpdateConfig,
  onConflictDoUpdateSet,
  onConflictDoUpdateTarget,
} from "@qcksys/drizzle-extensions";

// Simple usage - targets pk/unique columns, updates everything else
await db
  .insert(tTable1)
  .values({
    id: 1,
    name: "qcksys",
    deleted: false,
    testing: true,
  })
  .onConflictDoUpdate(onConflictDoUpdateConfig(tTable1));

// Keep only specific columns for update
await db
  .insert(tTable1)
  .values({
    id: 1,
    name: "qcksys",
    deleted: false,
    testing: true,
  })
  .onConflictDoUpdate(
    onConflictDoUpdateConfig(tTable1, { keep: [tTable1.deleted] })
  );

// Exclude specific columns from update
await db
  .insert(tTable1)
  .values({
    id: 1,
    name: "qcksys",
    deleted: false,
    testing: true,
  })
  .onConflictDoUpdate(
    onConflictDoUpdateConfig(tTable1, { exclude: [tTable1.testing] })
  );

// Composite primary key - must specify target manually
await db
  .insert(orderItems)
  .values({ orderId: 1, productId: 1, quantity: 5, price: 100 })
  .onConflictDoUpdate({
    target: [orderItems.orderId, orderItems.productId],
    set: onConflictDoUpdateSet(orderItems, {
      target: [orderItems.orderId, orderItems.productId],
    }),
  });

// Target specific unique constraint instead of primary key
await db
  .insert(products)
  .values({ id: 1, sku: "SKU001", name: "Product", price: 100 })
  .onConflictDoUpdate({
    target: [products.sku],
    set: onConflictDoUpdateSet(products, { target: [products.sku] }),
  });

// Use individual functions for more control
await db
  .insert(tTable1)
  .values({ id: 1, name: "qcksys", deleted: false })
  .onConflictDoUpdate({
    target: onConflictDoUpdateTarget(tTable1),
    set: onConflictDoUpdateSet(tTable1, { keep: [tTable1.deleted] }),
  });
```

### useLiveTablesQuery (Expo SQLite)

A React hook for live queries that automatically re-executes when specified tables change.
Add the tables to listen to in the second argument.

```tsx
import { db } from "@/db/drizzle";
import { tTable1, tTable2 } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useLiveTablesQuery } from "@qcksys/drizzle-extensions";

function MyComponent() {
  const { data, error, updatedAt } = useLiveTablesQuery(
    db
      .select()
      .from(tTable1)
      .leftJoin(tTable2, eq(tTable1.id, tTable2.id)),
    [tTable1, tTable2]
  );

  if (error) return <Text>Error: {error.message}</Text>;
  if (!data) return <Text>Loading...</Text>;

  return <Text>Data updated at: {updatedAt?.toISOString()}</Text>;
}
```

## API Reference

### onDuplicateKeyUpdate (MySQL/SingleStore)

#### `onDuplicateKeyUpdateConfig(table, options?)`

Returns a complete config object for `.onDuplicateKeyUpdate()`.

#### `onDuplicateKeyUpdateSet(table, options?)`

Returns just the `set` object for manual configuration.

**Options:**

- `keep?: Column | Column[]` - Only update these columns
- `exclude?: Column | Column[]` - Exclude these columns from update

### onConflictDoUpdate (PostgreSQL/SQLite)

#### `onConflictDoUpdateConfig(table, options?)`

Returns a complete config object with `target` and `set` for `.onConflictDoUpdate()`.

#### `onConflictDoUpdateTarget(table, options?)`

Returns the target columns (primary keys and unique columns by default).

#### `onConflictDoUpdateSet(table, options?)`

Returns the `set` object with SQL expressions using `excluded.<column>` syntax.

**Options:**

- `target?: Column | Column[]` - Columns that trigger the conflict (required for composite keys)
- `keep?: Column | Column[]` - Only update these columns
- `exclude?: Column | Column[]` - Exclude these columns from update

### useLiveTablesQuery (Expo SQLite)

#### `useLiveTablesQuery(query, tables, deps?)`

A React hook that re-executes the query when any of the specified tables change.

**Parameters:**

- `query` - A Drizzle query (select or relational)
- `tables` - Array of SQLite tables to watch for changes
- `deps?` - Optional dependency array for the effect

**Returns:**

- `data` - Query result
- `error` - Error if query failed
- `updatedAt` - Timestamp of last successful query

## Development

### Scripts

```bash
# Run unit tests
pnpm test

# Run integration tests (requires Docker)
pnpm test:integration

# Run all tests
pnpm test:all

# Build the package
pnpm build

# Lint and format
pnpm biome:check:unsafe
```

### Testing

This package includes comprehensive tests:

- **Unit tests** (`test/unit/`) - Test the helper functions with mock tables
- **Integration tests** (`test/integration/`) - Test actual database operations using testcontainers

Integration tests require Docker to be running and will be automatically skipped if Docker is unavailable.

## License

MIT
