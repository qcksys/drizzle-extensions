import { int, mysqlTable, primaryKey, varchar } from "drizzle-orm/mysql-core";

export const mockMysqlTable = mysqlTable("mock_table", {
	int: int().primaryKey(),
	int2: int(),
	int3: int(),
	int4: int(),
});

export const mockMysqlTableUnique = mysqlTable("mock_table_unique", {
	int: int().primaryKey(),
	int2: int(),
	int3: int().unique(),
	int4: int(),
});

// Composite primary key table
export const mockMysqlTableComposite = mysqlTable(
	"mock_table_composite",
	{
		id1: int().notNull(),
		id2: int().notNull(),
		name: varchar({ length: 255 }),
		value: int(),
	},
	(table) => [primaryKey({ columns: [table.id1, table.id2] })],
);

// Table with multiple unique constraints
export const mockMysqlTableMultiUnique = mysqlTable("mock_table_multi_unique", {
	int: int().primaryKey(),
	email: varchar({ length: 255 }).unique(),
	username: varchar({ length: 255 }).unique(),
	name: varchar({ length: 255 }),
});
