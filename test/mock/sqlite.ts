import { integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const mockSqliteTable = sqliteTable("table", {
	int: integer().primaryKey(),
	int2: integer(),
	int3: integer(),
	int4: integer(),
});

export const mockSqliteTableUnique = sqliteTable("table", {
	int: integer().primaryKey(),
	int2: integer(),
	int3: integer().unique(),
	int4: integer(),
});
