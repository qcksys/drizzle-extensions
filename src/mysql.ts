import { type SQL, getTableColumns, sql } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";

export const buildConflictUpdateColumns = <
  TDrizzleTable extends MySqlTable,
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
      acc[name] = sql`values (${allColumns[name]})`;
      return acc;
    },
    {} as Record<TDrizzleTableCol, SQL>,
  );
};

export const onDuplicateKeyUpdateConfig = <
  TDrizzleTable extends MySqlTable,
  TDrizzleTableCol extends keyof TDrizzleTable["_"]["columns"],
>(
  table: TDrizzleTable,
  {
    keep,
    exclude,
  }: { keep?: TDrizzleTableCol[]; exclude?: TDrizzleTableCol[] } = {},
) => {
  return {
    set: buildConflictUpdateColumns(table, { keep, exclude }),
  };
};
