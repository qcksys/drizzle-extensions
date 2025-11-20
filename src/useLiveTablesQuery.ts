import { getTableName, is } from "drizzle-orm";
import type { AnySQLiteSelect } from "drizzle-orm/sqlite-core";
import { SQLiteRelationalQuery } from "drizzle-orm/sqlite-core/query-builders/query";
import type { SQLiteTable } from "drizzle-orm/sqlite-core/table";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useEffect, useState } from "react";

// Vendored from https://github.com/drizzle-team/drizzle-orm/issues/2660

/**
 * Add the tables to listen to in the second argument.
 */
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
		// @ts-expect-error
		(is(query, SQLiteRelationalQuery) && query.mode === "first"
			? undefined
			: []) as Awaited<T>,
	);
	const [error, setError] = useState<Error>();
	const [updatedAt, setUpdatedAt] = useState<Date>();

	// biome-ignore lint/correctness/useExhaustiveDependencies: The deps not included would cause the effect to run on every render, which is not desired.
	useEffect(() => {
		let listener: ReturnType<typeof addDatabaseChangeListener> | undefined;

		// biome-ignore lint/suspicious/noExplicitAny: Internal function handles types that are input
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
	}, [deps]);

	return {
		data,
		error,
		updatedAt,
	} as const;
};
