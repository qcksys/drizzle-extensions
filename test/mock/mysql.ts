import { int, mysqlTable } from "drizzle-orm/mysql-core";
import { drizzle } from "drizzle-orm/mysql2";
import { onDuplicateKeyUpdateConfig } from "../../src/onDuplicateKeyUpdate";
export const mockMysqlTable = mysqlTable("table", {
  int: int().primaryKey(),
  int2: int(),
  int3: int(),
  int4: int(),
});

export const mysqlDb = drizzle("mock");

mysqlDb
  .insert(mockMysqlTable)
  .values({ int: 1, int2: 2, int3: 3, int4: 4 })
  .onDuplicateKeyUpdate(onDuplicateKeyUpdateConfig(mockMysqlTable));
