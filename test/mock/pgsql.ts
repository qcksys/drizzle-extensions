import { drizzle } from "drizzle-orm/node-postgres";
import { integer, pgTable } from "drizzle-orm/pg-core";
import { onConflictDoUpdateConfig } from "../../src/onConflictDoUpdate.ts";
export const mockPgsqlTable = pgTable("table", {
  int: integer().primaryKey(),
  int2: integer(),
  int3: integer(),
  int4: integer(),
});

export const pgsqlDb = drizzle("mock");

pgsqlDb
  .insert(mockPgsqlTable)
  .values({ int: 1, int2: 2, int3: 3, int4: 4 })
  .onConflictDoUpdate(onConflictDoUpdateConfig(mockPgsqlTable));
