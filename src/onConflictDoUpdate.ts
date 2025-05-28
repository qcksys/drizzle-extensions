import { type SQL, getTableColumns, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { toArray } from "./utils.ts";

export const onConflictDoUpdateSet = <
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

export const onConflictDoUpdateTarget = <
  TDrizzleTable extends PgTable | SQLiteTable,
  TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
>(
  table: TDrizzleTable,
  {
    target,
    exclude,
  }: {
    target?: TDrizzleTableCol[];
    exclude?: TDrizzleTableCol[];
  } = {},
) => {
  const targetArray = toArray(target);

  if (targetArray.length) return targetArray;

  const excludeArray = toArray(exclude);
  const excludeNames = excludeArray.map((col) => col.name);

  const allColumns = getTableColumns(table);
  const keepColumns = Object.values(allColumns);
  const keepColumnNames: TDrizzleTableCol["name"][] = keepColumns.map(
    (col) => col.name,
  );
  const targetCols: ReturnType<typeof getTableColumns>[string][] = [];
  for (const name in keepColumnNames) {
    const col = allColumns[name];
    if (
      col &&
      allColumns[name] &&
      (col.primary || col.isUnique || excludeNames?.includes(name))
    ) {
      targetCols.push(allColumns[name]);
    }
  }
  return targetCols;
};

export const onConflictDoUpdateConfig = <
  TDrizzleTable extends PgTable | SQLiteTable,
  TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
>(
  table: TDrizzleTable,
  {
    target,
    keep,
    exclude,
  }: {
    target?: TDrizzleTableCol[];
    keep?: TDrizzleTableCol[];
    exclude?: TDrizzleTableCol[];
  } = {},
) => {
  return {
    target: onConflictDoUpdateTarget(table, { target, exclude }),
    set: onConflictDoUpdateSet(table, { keep, exclude }),
  };
};
