# @qcksys/drizzle-extensions

## Usage

### onConflictDoUpdate (PostgreSQL, SQLite)

```ts
import { db } from "@/db/drizzle";
import { tTable1 } from "@/db/schema";
import { onConflictDoUpdateConfig } from "@qcksys/drizzle-extensions/onConflictDoUpdate";

await db
    .insert(tWorks)
    .values({
        id: 1,
        name: "qcksys",
    })
    .onConflictDoUpdate(
        onConflictDoUpdateConfig(tWorks)
    );
```

### onDuplicateKeyUpdate (MySQL, SingleStore)

```ts
import { db } from "@/db/drizzle";
import { tTable1 } from "@/db/schema";
import { onDuplicateKeyUpdateConfig } from "@qcksys/drizzle-extensions/onDuplicateKeyUpdate";

await db
    .insert(tWorks)
    .values({
        id: 1,
        name: "qcksys",
    })
    .onDuplicateKeyUpdate(
        onDuplicateKeyUpdateConfig(tWorks)
    );
```

### useLiveTablesQuery (Expo SQLite)

```ts
import { db } from "@/db/drizzle";
import { tTable1, tTable2 } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useLiveTablesQuery } from "@qcksys/drizzle-extensions/useLiveTablesQuery";

const { data } = useLiveTablesQuery(
        db
            .select({
                table1Id: tTable1.id,
                table2Id: tTable2.id,
            })
            .from(tTable1)
            .leftJoin(
                tTable2,
                eq(table1.id, table2.id),
            ),
        [tTable1, tTable2],
    )
;
```