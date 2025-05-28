# @qcksys/drizzle-extensions

## Usage

### onConflictDoUpdate (PostgreSQL, SQLite)

```ts
await db
    .insert(table)
    .values({
        id: workInfo.workUrlData.workId,
        title: workInfo.workName,
        chapters: workInfo.totalChapters,
        lastUpdated: workInfo.workLastUpdated,
    })
    .onConflictDoUpdate({
        target: tWorks.id,
        set: buildConflictUpdateColumns(tWorks, [,]),
    });
```

### onDuplicateKeyUpdate (MySQL, SingleStore)

```ts
import { db } from "@/db/drizzle";
import { tTable1 } from "@/db/schema";
import { useLiveTablesQuery } from "@qcksys/drizzle-extensions/sqlite-expo";

await db
    .insert(tWorks)
    .values({
        id: workInfo.workUrlData.workId,
        title: workInfo.workName,
        chapters: workInfo.totalChapters,
        lastUpdated: workInfo.workLastUpdated,
    })
    .onConflictDoUpdate({
        target: tWorks.id,
        set: buildConflictUpdateColumns(tWorks, [,]),
    });
```

### useLiveTablesQuery (Expo SQLite)

```ts
import { db } from "@/db/drizzle";
import { tTable1, tTable2 } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useLiveTablesQuery } from "@qcksys/drizzle-extensions/sqlite-expo";

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