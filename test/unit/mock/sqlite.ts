import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const mockSqliteTable = sqliteTable("mock_table", {
	int: integer().primaryKey(),
	int2: integer(),
	int3: integer(),
	int4: integer(),
});

export const mockSqliteTableUnique = sqliteTable("mock_table_unique", {
	int: integer().primaryKey(),
	int2: integer(),
	int3: integer().unique(),
	int4: integer(),
});

// Composite primary key table
export const mockSqliteTableComposite = sqliteTable(
	"mock_table_composite",
	{
		id1: integer().notNull(),
		id2: integer().notNull(),
		name: text(),
		value: integer(),
	},
	(table) => [primaryKey({ columns: [table.id1, table.id2] })],
);

// Table with multiple unique constraints
export const mockSqliteTableMultiUnique = sqliteTable(
	"mock_table_multi_unique",
	{
		int: integer().primaryKey(),
		email: text().unique(),
		username: text().unique(),
		name: text(),
	},
);
