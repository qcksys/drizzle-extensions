import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
	onConflictDoUpdateConfig,
	onConflictDoUpdateSet,
	onConflictDoUpdateTarget,
} from "../src/onConflictDoUpdate";
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

	it("should handle empty exclude array", () => {
		expect(
			onConflictDoUpdateSet(mockSqliteTable, { exclude: [] }),
		).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should handle empty keep array", () => {
		expect(onConflictDoUpdateSet(mockSqliteTable, { keep: [] })).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should handle both exclude and keep options together", () => {
		expect(
			onConflictDoUpdateSet(mockSqliteTable, {
				keep: [mockSqliteTable.int2, mockSqliteTable.int3],
				exclude: [mockSqliteTable.int3],
			}),
		).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
		});
	});

	it("should handle target, keep, and exclude options together", () => {
		expect(
			onConflictDoUpdateSet(mockSqliteTable, {
				target: [mockSqliteTable.int],
				keep: [
					mockSqliteTable.int2,
					mockSqliteTable.int3,
					mockSqliteTable.int4,
				],
				exclude: [mockSqliteTable.int4],
			}),
		).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int3: sql.raw(`excluded.int3`),
		});
	});

	it("should exclude unique columns from set when no target specified", () => {
		expect(onConflictDoUpdateSet(mockSqliteTableUnique)).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should handle single column parameters instead of arrays", () => {
		expect(
			onConflictDoUpdateSet(mockSqliteTable, {
				target: mockSqliteTable.int2,
				keep: mockSqliteTable.int3,
				exclude: mockSqliteTable.int4,
			}),
		).toStrictEqual({
			int3: sql.raw(`excluded.int3`),
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

	it("should handle empty exclude array", () => {
		expect(
			onConflictDoUpdateTarget(mockSqliteTableUnique, { exclude: [] }),
		).toContain(mockSqliteTableUnique.int);
		expect(
			onConflictDoUpdateTarget(mockSqliteTableUnique, { exclude: [] }),
		).toContain(mockSqliteTableUnique.int3);
	});

	it("should handle single column exclude parameter", () => {
		const result = onConflictDoUpdateTarget(mockSqliteTableUnique, {
			exclude: mockSqliteTableUnique.int3,
		});
		expect(result).toContain(mockSqliteTableUnique.int);
		expect(result).not.toContain(mockSqliteTableUnique.int3);
		expect(result).toHaveLength(1);
	});

	it("should handle single column target parameter", () => {
		expect(
			onConflictDoUpdateTarget(mockSqliteTable, {
				target: mockSqliteTable.int2,
			}),
		).toStrictEqual([mockSqliteTable.int2]);
	});

	it("should return empty array when all constraint columns are excluded", () => {
		const result = onConflictDoUpdateTarget(mockSqliteTableUnique, {
			exclude: [mockSqliteTableUnique.int, mockSqliteTableUnique.int3],
		});
		expect(result).toHaveLength(0);
	});

	it("should work with PostgreSQL tables", () => {
		expect(onConflictDoUpdateTarget(mockPgsqlTable)).toStrictEqual([
			mockPgsqlTable.int,
		]);
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

	it("should handle empty options object", () => {
		const config = onConflictDoUpdateConfig(mockSqliteTable, {});
		expect(config.target).toStrictEqual([mockSqliteTable.int]);
		expect(config.set).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should work with unique constraint tables", () => {
		const config = onConflictDoUpdateConfig(mockSqliteTableUnique);
		expect(config.target).toContain(mockSqliteTableUnique.int);
		expect(config.target).toContain(mockSqliteTableUnique.int3);
		expect(config.set).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int4: sql.raw(`excluded.int4`),
		});
	});

	it("should handle single column parameters", () => {
		const config = onConflictDoUpdateConfig(mockSqliteTable, {
			target: mockSqliteTable.int2,
			keep: mockSqliteTable.int3,
		});
		expect(config.target).toStrictEqual([mockSqliteTable.int2]);
		expect(config.set).toStrictEqual({
			int3: sql.raw(`excluded.int3`),
		});
	});

	it("should work with PostgreSQL tables", () => {
		const config = onConflictDoUpdateConfig(mockPgsqlTable);
		expect(config.target).toStrictEqual([mockPgsqlTable.int]);
		expect(config.set).toStrictEqual({
			int2: sql.raw(`excluded.int2`),
			int3: sql.raw(`excluded.int3`),
			int4: sql.raw(`excluded.int4`),
		});
	});
});
