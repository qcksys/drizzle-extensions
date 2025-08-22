import { getTableColumns, type SQL, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { toArray } from "./utils.ts";

/**
 * By default, it will update all columns except the primary key and unique indexes.
 * You can explicitly specify which columns to keep or exclude.
 *
 * Composite primary/unique keys are not automatically detected, so will need to be specified in the "target" option.
 */
export const onConflictDoUpdateSet = <
	TDrizzleTable extends PgTable | SQLiteTable,
	TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
	TDrizzleTableColTarget extends TDrizzleTableCol,
	TDrizzleTableColKeep extends TDrizzleTableCol,
	TDrizzleTableColExclude extends TDrizzleTableCol,
>(
	table: TDrizzleTable,
	{
		target,
		keep,
		exclude,
	}: {
		target?: TDrizzleTableColTarget[] | TDrizzleTableColTarget;
		keep?: TDrizzleTableColKeep[] | TDrizzleTableColKeep;
		exclude?: TDrizzleTableColExclude[] | TDrizzleTableColExclude;
	} = {},
) => {
	const targetArray = toArray(target);
	const keepArray = toArray(keep);
	const excludeArray = toArray(exclude);
	const excludeNames = excludeArray.map((col) => col.name);

	const allColumns = getTableColumns(table);
	const keepColumns = keepArray.length ? keepArray : Object.values(allColumns);
	const keepColumnNames: TDrizzleTableCol["name"][] = keepColumns.map(
		(col) => col.name,
	);
	const targetColumnNames: TDrizzleTableCol["name"][] = targetArray.map(
		(col) => col.name,
	);
	return keepColumnNames.reduce(
		(acc, name) => {
			const col = allColumns[name];
			if (
				col?.primary ||
				col?.isUnique ||
				excludeNames?.includes(name) ||
				targetColumnNames?.includes(name)
			) {
				return acc;
			}
			acc[name] = sql.raw(`excluded.${name}`);
			return acc;
		},
		{} as Record<TDrizzleTableCol["name"], SQL>,
	);
};

/**
 * By default, it will update all columns except the primary key and unique indexes.
 * You can explicitly specify which columns to keep or exclude.
 *
 * Composite primary/unique keys are not automatically detected, so will need to be specified in the "target" option.
 */
export const onConflictDoUpdateTarget = <
	TDrizzleTable extends PgTable | SQLiteTable,
	TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
	TDrizzleTableColTarget extends TDrizzleTableCol,
	TDrizzleTableColExclude extends TDrizzleTableCol,
>(
	table: TDrizzleTable,
	{
		target,
		exclude,
	}: {
		target?: TDrizzleTableColTarget[] | TDrizzleTableColTarget;
		exclude?: TDrizzleTableColExclude[] | TDrizzleTableColExclude;
	} = {},
) => {
	const targetArray = toArray(target);

	if (targetArray.length) return targetArray;

	const excludeArray = toArray(exclude);
	const excludeNames = excludeArray.map((col) => col.name);
	const allColumns = getTableColumns(table);
	const targetColumns = Object.values(allColumns);
	return targetColumns.filter(
		(col) =>
			col && (col.primary || col.isUnique) && !excludeNames?.includes(col.name),
	);
};

/**
 * By default, it will update all columns except the primary key and unique indexes.
 * You can explicitly specify which columns to keep or exclude.
 *
 * Composite primary/unique keys are not automatically detected, so will need to be specified in the "target" option.
 */
export const onConflictDoUpdateConfig = <
	TDrizzleTable extends PgTable | SQLiteTable,
	TDrizzleTableCol extends TDrizzleTable["_"]["columns"][string],
	TDrizzleTableColTarget extends TDrizzleTableCol,
	TDrizzleTableColKeep extends TDrizzleTableCol,
	TDrizzleTableColExclude extends TDrizzleTableCol,
>(
	table: TDrizzleTable,
	{
		target,
		keep,
		exclude,
	}: {
		target?: TDrizzleTableColTarget[] | TDrizzleTableColTarget;
		keep?: TDrizzleTableColKeep[] | TDrizzleTableColKeep;
		exclude?: TDrizzleTableColExclude[] | TDrizzleTableColExclude;
	} = {},
) => {
	return {
		target: onConflictDoUpdateTarget(table, { target, exclude }),
		set: onConflictDoUpdateSet(table, { target, keep, exclude }),
	};
};
