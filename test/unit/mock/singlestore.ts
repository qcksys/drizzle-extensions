import { int, singlestoreTable, varchar } from "drizzle-orm/singlestore-core";

export const mockSinglestoreTable = singlestoreTable("mock_table", {
	int: int().primaryKey(),
	int2: int(),
	int3: int(),
	int4: int(),
});

export const mockSinglestoreTableUnique = singlestoreTable(
	"mock_table_unique",
	{
		int: int().primaryKey(),
		int2: int(),
		int3: int().unique(),
		int4: int(),
	},
);

// Table with multiple unique constraints
export const mockSinglestoreTableMultiUnique = singlestoreTable(
	"mock_table_multi_unique",
	{
		int: int().primaryKey(),
		email: varchar({ length: 255 }).unique(),
		username: varchar({ length: 255 }).unique(),
		name: varchar({ length: 255 }),
	},
);
