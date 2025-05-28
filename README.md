# @qcksys/drizzle-extensions

## Usage

### onDuplicateKeyUpdate (MySQL, SingleStore)

By default, it will update all columns except the primary key and unique indexes.\
You can explicitly specify which columns to keep or exclude.

```ts
import { db } from "@/db/drizzle";
import { tTable1 } from "@/db/schema";
import { onDuplicateKeyUpdateConfig } from "@qcksys/drizzle-extensions/onDuplicateKeyUpdate";

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
```

### onConflictDoUpdate (PostgreSQL, SQLite)

```ts
import { db } from "@/db/drizzle";
import { tTable1 } from "@/db/schema";
import { onConflictDoUpdateConfig } from "@qcksys/drizzle-extensions/onConflictDoUpdate";

await db
    .insert(tTable1)
    .values({
        id: 1,
        name: "qcksys",
        deleted: false,
        testing: true,
    })
    .onConflictDoUpdate(
        onConflictDoUpdateConfig(tTable1)
    );
```

### useLiveTablesQuery (Expo SQLite)

Add the tables to listen to in the second argument.

```ts
import { db } from "@/db/drizzle";
import { tTable1, tTable2 } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useLiveTablesQuery } from "@qcksys/drizzle-extensions/useLiveTablesQuery";

const { data } = useLiveTablesQuery(
        db
            .select()
            .from(tTable1)
            .leftJoin(
                tTable2,
                eq(table1.id, table2.id),
            ),
        [tTable1, tTable2],
    )
;
```