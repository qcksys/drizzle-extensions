import { getTableColumns, type SQL, sql } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import type { SingleStoreTable } from "drizzle-orm/singlestore-core";
import { toArray } from "./utils.ts";

/**
 * By default, it will update all columns except the primary key and unique indexes.
 * You can explicitly specify which columns to keep or exclude.
 *
 * Composite primary/unique keys are not automatically detected, so will need to be specified in the "excludes" option.
 */
export const onDuplicateKeyUpdateSet = <
    TDrizzleTable extends MySqlTable | SingleStoreTable,
    TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
>(
    table: TDrizzleTable,
    {
        keep,
        exclude,
    }: {
        keep?: TDrizzleTableCol[] | TDrizzleTableCol;
        exclude?: TDrizzleTableCol[] | TDrizzleTableCol;
    } = {},
) => {
    const keepArray = toArray(keep);
    const keepNames = keepArray.map((col) => col?.name);
    const excludeArray = toArray(exclude);
    const excludeNames = excludeArray.map((col) => col?.name);
    const allColumns = getTableColumns(table);
    const toFilterCols = keepArray.length ? keepArray : Object.values(allColumns);
    return toFilterCols.reduce(
        (acc, col) => {
            if (
                !keepNames.includes(col.name) &&
                (col.primary || col.isUnique || excludeNames?.includes(col.name))
            ) {
                return acc;
            }
            acc[col.name] = sql.raw(`values(${col.name})`);
            return acc;
        },
        {} as Record<string, SQL>,
    );
};

/**
 * By default, it will update all columns except the primary key and unique indexes.
 * You can explicitly specify which columns to keep or exclude.
 *
 * Composite primary/unique keys are not automatically detected, so will need to be specified in the "excludes" option.
 */
export const onDuplicateKeyUpdateConfig = <
    TDrizzleTable extends MySqlTable,
    TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
>(
    table: TDrizzleTable,
    {
        keep,
        exclude,
    }: {
        keep?: TDrizzleTableCol[] | TDrizzleTableCol;
        exclude?: TDrizzleTableCol[] | TDrizzleTableCol;
    } = {},
) => {
    return {
        set: onDuplicateKeyUpdateSet(table, { keep, exclude }),
    };
};
