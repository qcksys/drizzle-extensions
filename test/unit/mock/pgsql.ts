import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

export const mockPgsqlTable = pgTable("mock_table", {
	int: integer().primaryKey(),
	int2: integer(),
	int3: integer(),
	int4: integer(),
});

export const mockPgsqlTableUnique = pgTable("mock_table_unique", {
	int: integer().primaryKey(),
	int2: integer(),
	int3: integer().unique(),
	int4: integer(),
});

// Composite primary key table
export const mockPgsqlTableComposite = pgTable(
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
export const mockPgsqlTableMultiUnique = pgTable("mock_table_multi_unique", {
	int: integer().primaryKey(),
	email: text().unique(),
	username: text().unique(),
	name: text(),
});
