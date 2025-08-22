import { describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import {
	onConflictDoUpdateConfig,
	onConflictDoUpdateSet,
	onConflictDoUpdateTarget,
} from "../src/onConflictDoUpdate.ts";
import { mockPgsqlTable } from "./mock/pgsql.ts";
import { mockSqliteTable, mockSqliteTableUnique } from "./mock/sqlite.ts";

describe("should", () => {
	it("export onConflictDoUpdateConfig", () => {
		expect(onConflictDoUpdateConfig).toBeDefined();
	});
	it("export onConflictDoUpdateSet", () => {
		expect(onConflictDoUpdateSet).toBeDefined();
	});
	it("export onConflictDoUpdateTarget", () => {
		expect(onConflictDoUpdateTarget).toBeDefined();
	});
});

describe("onConflictDoUpdateSet", () => {
	it("should generate the appropriate set for non composite pk", () => {
		expect(onConflictDoUpdateSet(mockSqliteTable)).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should generate the appropriate set for manually set exclude", () => {
		expect(
			onConflictDoUpdateSet(mockSqliteTable, {
				exclude: [mockSqliteTable.int2],
			}),
		).toStrictEqual({
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should generate the appropriate set for manually set keep", () => {
		expect(
			onConflictDoUpdateSet(mockSqliteTable, { keep: [mockSqliteTable.int2] }),
		).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
		});
	});

	it("should generate the appropriate set for non composite uk", () => {
		expect(onConflictDoUpdateSet(mockSqliteTableUnique)).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should generate the appropriate set with manually set target", () => {
		expect(
			onConflictDoUpdateSet(mockSqliteTable, {
				target: [mockSqliteTable.int2],
			}),
		).toStrictEqual({
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should work with PostgreSQL tables", () => {
		expect(onConflictDoUpdateSet(mockPgsqlTable)).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});
});

describe("onConflictDoUpdateTarget", () => {
	it("should return manually specified target columns", () => {
		const target = [mockSqliteTable.int2];
		expect(onConflictDoUpdateTarget(mockSqliteTable, { target })).toStrictEqual(
			target,
		);
	});

	it("should return primary key columns when no target specified", () => {
		expect(onConflictDoUpdateTarget(mockSqliteTable)).toStrictEqual([
			mockSqliteTable.int,
		]);
	});

	it("should return primary and unique columns when no target specified", () => {
		const result = onConflictDoUpdateTarget(mockSqliteTableUnique);
		expect(result).toContain(mockSqliteTableUnique.int);
		expect(result).toContain(mockSqliteTableUnique.int3);
		expect(result).toHaveLength(2);
	});

	it("should exclude specified columns from auto-detected targets", () => {
		const result = onConflictDoUpdateTarget(mockSqliteTableUnique, {
			exclude: [mockSqliteTableUnique.int3],
		});
		expect(result).toContain(mockSqliteTableUnique.int);
		expect(result).not.toContain(mockSqliteTableUnique.int3);
		expect(result).toHaveLength(1);
	});
});

describe("onConflictDoUpdateConfig", () => {
	it("should return config with target and set", () => {
		const config = onConflictDoUpdateConfig(mockSqliteTable);
		expect(config).toHaveProperty("target");
		expect(config).toHaveProperty("set");
		expect(config.target).toStrictEqual([mockSqliteTable.int]);
		expect(config.set).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should pass through options to both functions", () => {
		const config = onConflictDoUpdateConfig(mockSqliteTable, {
			target: [mockSqliteTable.int2],
			keep: [mockSqliteTable.int3],
			exclude: [mockSqliteTable.int4],
		});
		expect(config.target).toStrictEqual([mockSqliteTable.int2]);
		expect(config.set).toStrictEqual({
			int3: sql.raw(`excluded.int3`),
		});
	});
});
