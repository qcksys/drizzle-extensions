import { type SQL, getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SQLiteTable } from "drizzle-orm/sqlite-core/table";

export const buildOnConflictDoUpdate = <
  TDrizzleTable extends PgTable | SQLiteTable,
  TDrizzleTableCol extends keyof TDrizzleTable["_"]["columns"],
>(
  table: TDrizzleTable,
  {
    keep,
    exclude,
  }: { keep?: TDrizzleTableCol[]; exclude?: TDrizzleTableCol[] } = {},
) => {
  const allColumns = getTableColumns(table);
  const allColumnNames = Object.keys(allColumns) as TDrizzleTableCol[];
  const keepColumnNames = keep ?? allColumnNames;
  return keepColumnNames.reduce(
    (acc, name) => {
      const col = allColumns[name];
      if (col && (col.primary || col.isUnique || exclude?.includes(name))) {
        return acc;
      }
      acc[name] = sql`excluded.${allColumns[name]}`;
      return acc;
    },
    {} as Record<TDrizzleTableCol, SQL>,
  );
};

export const onConflictDoUpdateConfig = <
  TDrizzleTable extends PgTable | SQLiteTable,
  TDrizzleTableCol extends keyof TDrizzleTable["_"]["columns"],
>(
  table: TDrizzleTable,
  {
    keep,
    exclude,
  }: { keep?: TDrizzleTableCol[]; exclude?: TDrizzleTableCol[] } = {},
) => {
  return {
    set: buildOnConflictDoUpdate(table, { keep, exclude }),
  };
};
