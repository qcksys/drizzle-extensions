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
	const [data, setData] = useState<unknown>(
		// @ts-expect-error
		(is(query, SQLiteRelationalQuery) && query.mode === "first"
			? undefined
			: []) as unknown,
	);
	const [error, setError] = useState<Error>();
	const [updatedAt, setUpdatedAt] = useState<Date>();

	// biome-ignore lint/correctness/useExhaustiveDependencies: The deps not included would cause the effect to run on every render, which is not desired.
	useEffect(() => {
		let listener: ReturnType<typeof addDatabaseChangeListener> | undefined;

		const handleData = (data: unknown) => {
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
