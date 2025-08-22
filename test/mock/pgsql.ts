import { integer, pgTable } from "drizzle-orm/pg-core";

export const mockPgsqlTable = pgTable("table", {
	int: integer().primaryKey(),
	int2: integer(),
	int3: integer(),
	int4: integer(),
});
