import { drizzle } from "drizzle-orm/libsql";
import { integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { onConflictDoUpdateConfig } from "../../src/onConflictDoUpdate.ts";
export const mockSqliteTable = sqliteTable("table", {
	int: integer().primaryKey(),
	int2: integer(),
	int3: integer(),
	int4: integer(),
});
export const sqliteDb = drizzle({
	connection: {
		url: "mock",
	},
});

sqliteDb
	.insert(mockSqliteTable)
	.values({ int: 1, int2: 2, int3: 3, int4: 4 })
	.onConflictDoUpdate(onConflictDoUpdateConfig(mockSqliteTable));
