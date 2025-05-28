import { type SQL, getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { toArray } from "./utils.ts";

export const buildOnConflictDoUpdate = <
  TDrizzleTable extends PgTable | SQLiteTable,
  TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
>(
  table: TDrizzleTable,
  {
    keep,
    exclude,
  }: { keep?: TDrizzleTableCol[]; exclude?: TDrizzleTableCol[] } = {},
) => {
  const keepArray = toArray(keep);
  const excludeArray = toArray(exclude);
  const excludeNames = excludeArray.map((col) => col.name);

  const allColumns = getTableColumns(table);
  const keepColumns = keepArray ?? Object.values(allColumns);
  const keepColumnNames: TDrizzleTableCol["name"][] = keepColumns.map(
    (col) => col.name,
  );
  return keepColumnNames.reduce(
    (acc, name) => {
      const col = allColumns[name];
      if (
        col &&
        (col.primary || col.isUnique || excludeNames?.includes(name))
      ) {
        return acc;
      }
      acc[name] = sql`excluded.${allColumns[name]}`;
      return acc;
    },
    {} as Record<TDrizzleTableCol["name"], SQL>,
  );
};

export const onConflictDoUpdateConfig = <
  TDrizzleTable extends PgTable | SQLiteTable,
  TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
>(
  table: TDrizzleTable,
  target: TDrizzleTableCol | TDrizzleTableCol[],
  {
    keep,
    exclude,
  }: { keep?: TDrizzleTableCol[]; exclude?: TDrizzleTableCol[] } = {},
) => {
  return {
    target,
    set: buildOnConflictDoUpdate(table, { keep, exclude }),
  };
};
