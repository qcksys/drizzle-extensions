import { getTableColumns, type SQL, sql } from "drizzle-orm";
import type { MySqlTable } from "drizzle-orm/mysql-core";
import type { SingleStoreTable } from "drizzle-orm/singlestore-core";
import { toArray } from "./utils.ts";

export const onDuplicateKeyUpdateSet = <
	TDrizzleTable extends MySqlTable | SingleStoreTable,
	TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
>(
	table: TDrizzleTable,
	{
		keep,
		exclude,
	}: {
		keep?: TDrizzleTableCol | TDrizzleTableCol[];
		exclude?: TDrizzleTableCol | TDrizzleTableCol[];
	} = {},
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
			acc[name] = sql.raw(`values(${allColumns[name]})`);
			return acc;
		},
		{} as Record<TDrizzleTableCol["name"], SQL>,
	);
};

export const onDuplicateKeyUpdateConfig = <
	TDrizzleTable extends MySqlTable | SingleStoreTable,
	TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
>(
	table: TDrizzleTable,
	{
		keep,
		exclude,
	}: {
		keep?: TDrizzleTableCol | TDrizzleTableCol[];
		exclude?: TDrizzleTableCol | TDrizzleTableCol[];
	} = {},
) => {
	return {
		set: onDuplicateKeyUpdateSet(table, { keep, exclude }),
	};
};
