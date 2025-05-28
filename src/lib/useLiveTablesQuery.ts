import { getTableName, is } from "drizzle-orm";
import type { AnySQLiteSelect } from "drizzle-orm/sqlite-core";
import { SQLiteRelationalQuery } from "drizzle-orm/sqlite-core/query-builders/query";
import type { SQLiteTable } from "drizzle-orm/sqlite-core/table";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useEffect, useState } from "react";

export const useLiveTablesQuery = <
  T extends
    | Pick<AnySQLiteSelect, "_" | "then">
    | SQLiteRelationalQuery<"sync", unknown>,
>(
  query: T,
  tables: SQLiteTable[],
  deps: unknown[] = [],
) => {
  const [data, setData] = useState<Awaited<T>>(
    // @ts-ignore
    (is(query, SQLiteRelationalQuery) && query.mode === "first"
      ? undefined
      : []) as Awaited<T>,
  );
  const [error, setError] = useState<Error>();
  const [updatedAt, setUpdatedAt] = useState<Date>();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // biome-ignore lint/style/useConst: <explanation>
    let listener: ReturnType<typeof addDatabaseChangeListener> | undefined;

    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const handleData = (data: any) => {
      setData(data);
      setUpdatedAt(new Date());
    };

    query.then(handleData).catch(setError);

    listener = addDatabaseChangeListener(({ tableName }) => {
      if (tables.map((table) => getTableName(table)).includes(tableName)) {
        query.then(handleData).catch(setError);
      }
    });

    return () => {
      listener?.remove();
    };
  }, deps);

  return {
    data,
    error,
    updatedAt,
  } as const;
};
