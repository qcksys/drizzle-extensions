import { int, mysqlTable } from "drizzle-orm/mysql-core";

export const mockMysqlTable = mysqlTable("table", {
	int: int().primaryKey(),
	int2: int(),
	int3: int(),
	int4: int(),
});

export const mockMysqlTableUnique = mysqlTable("table", {
	int: int().primaryKey(),
	int2: int(),
	int3: int().unique(),
	int4: int(),
});
