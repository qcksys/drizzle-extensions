import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
	onConflictDoUpdateConfig,
	onConflictDoUpdateSet,
	onConflictDoUpdateTarget,
} from "~/onConflictDoUpdate.ts";
import {
	mockPgsqlTable,
	mockPgsqlTableComposite,
	mockPgsqlTableMultiUnique,
	mockPgsqlTableUnique,
} from "~test/unit/mock/pgsql.ts";
import {
	mockSqliteTable,
	mockSqliteTableComposite,
	mockSqliteTableMultiUnique,
	mockSqliteTableUnique,
} from "~test/unit/mock/sqlite.ts";

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

describe("composite primary key tables", () => {
	describe("onConflictDoUpdateSet", () => {
		it("should handle composite pk with manual target", () => {
			const result = onConflictDoUpdateSet(mockSqliteTableComposite, {
				target: [mockSqliteTableComposite.id1, mockSqliteTableComposite.id2],
			});
			expect(result).toStrictEqual({
				name: sql.raw(`excluded.name`),
				value: sql.raw(`excluded.value`),
			});
		});

		it("should handle composite pk PostgreSQL with manual target", () => {
			const result = onConflictDoUpdateSet(mockPgsqlTableComposite, {
				target: [mockPgsqlTableComposite.id1, mockPgsqlTableComposite.id2],
			});
			expect(result).toStrictEqual({
				name: sql.raw(`excluded.name`),
				value: sql.raw(`excluded.value`),
			});
		});

		it("should allow keeping specific columns with composite pk", () => {
			const result = onConflictDoUpdateSet(mockSqliteTableComposite, {
				target: [mockSqliteTableComposite.id1, mockSqliteTableComposite.id2],
				keep: [mockSqliteTableComposite.name],
			});
			expect(result).toStrictEqual({
				name: sql.raw(`excluded.name`),
			});
		});
	});

	describe("onConflictDoUpdateTarget", () => {
		it("should return manual target for composite pk tables", () => {
			const target = [
				mockSqliteTableComposite.id1,
				mockSqliteTableComposite.id2,
			];
			const result = onConflictDoUpdateTarget(mockSqliteTableComposite, {
				target,
			});
			expect(result).toStrictEqual(target);
		});
	});

	describe("onConflictDoUpdateConfig", () => {
		it("should work with composite pk and manual target", () => {
			const config = onConflictDoUpdateConfig(mockSqliteTableComposite, {
				target: [mockSqliteTableComposite.id1, mockSqliteTableComposite.id2],
			});
			expect(config.target).toStrictEqual([
				mockSqliteTableComposite.id1,
				mockSqliteTableComposite.id2,
			]);
			expect(config.set).toStrictEqual({
				name: sql.raw(`excluded.name`),
				value: sql.raw(`excluded.value`),
			});
		});
	});
});

describe("multiple unique constraints", () => {
	describe("onConflictDoUpdateSet", () => {
		it("should exclude all unique columns from set by default", () => {
			const result = onConflictDoUpdateSet(mockSqliteTableMultiUnique);
			expect(result).toStrictEqual({
				name: sql.raw(`excluded.name`),
			});
		});

		it("should work with PostgreSQL multi-unique tables", () => {
			const result = onConflictDoUpdateSet(mockPgsqlTableMultiUnique);
			expect(result).toStrictEqual({
				name: sql.raw(`excluded.name`),
			});
		});

		it("should allow targeting specific unique column", () => {
			const result = onConflictDoUpdateSet(mockSqliteTableMultiUnique, {
				target: [mockSqliteTableMultiUnique.email],
			});
			// When targeting email, it's excluded from the set
			// but unique columns are still auto-excluded
			expect(result).toHaveProperty("name");
		});
	});

	describe("onConflictDoUpdateTarget", () => {
		it("should return all unique columns plus primary key by default", () => {
			const result = onConflictDoUpdateTarget(mockSqliteTableMultiUnique);
			expect(result).toContain(mockSqliteTableMultiUnique.int);
			expect(result).toContain(mockSqliteTableMultiUnique.email);
			expect(result).toContain(mockSqliteTableMultiUnique.username);
			expect(result).toHaveLength(3);
		});

		it("should allow excluding specific unique columns", () => {
			const result = onConflictDoUpdateTarget(mockSqliteTableMultiUnique, {
				exclude: [mockSqliteTableMultiUnique.username],
			});
			expect(result).toContain(mockSqliteTableMultiUnique.int);
			expect(result).toContain(mockSqliteTableMultiUnique.email);
			expect(result).not.toContain(mockSqliteTableMultiUnique.username);
			expect(result).toHaveLength(2);
		});
	});

	describe("onConflictDoUpdateConfig", () => {
		it("should properly configure for multi-unique table", () => {
			const config = onConflictDoUpdateConfig(mockSqliteTableMultiUnique);
			expect(config.target).toHaveLength(3);
			expect(config.set).toStrictEqual({
				name: sql.raw(`excluded.name`),
			});
		});

		it("should work when targeting only one unique column", () => {
			const config = onConflictDoUpdateConfig(mockSqliteTableMultiUnique, {
				target: [mockSqliteTableMultiUnique.email],
			});
			expect(config.target).toStrictEqual([mockSqliteTableMultiUnique.email]);
			// Unique columns are still auto-excluded from the set
			expect(config.set).toHaveProperty("name");
		});
	});
});

describe("PostgreSQL unique constraint tables", () => {
	describe("onConflictDoUpdateSet", () => {
		it("should exclude unique columns from set", () => {
			const result = onConflictDoUpdateSet(mockPgsqlTableUnique);
			expect(result).toStrictEqual({
				int2: sql.raw(`excluded.int2`),
				int4: sql.raw(`excluded.int4`),
			});
		});
	});

	describe("onConflictDoUpdateTarget", () => {
		it("should return primary and unique columns", () => {
			const result = onConflictDoUpdateTarget(mockPgsqlTableUnique);
			expect(result).toContain(mockPgsqlTableUnique.int);
			expect(result).toContain(mockPgsqlTableUnique.int3);
			expect(result).toHaveLength(2);
		});
	});

	describe("onConflictDoUpdateConfig", () => {
		it("should work with PostgreSQL unique constraint table", () => {
			const config = onConflictDoUpdateConfig(mockPgsqlTableUnique);
			expect(config.target).toContain(mockPgsqlTableUnique.int);
			expect(config.target).toContain(mockPgsqlTableUnique.int3);
			expect(config.set).toStrictEqual({
				int2: sql.raw(`excluded.int2`),
				int4: sql.raw(`excluded.int4`),
			});
		});
	});
});

describe("edge cases", () => {
	it("should return empty set when all columns are targets or excluded", () => {
		const result = onConflictDoUpdateSet(mockSqliteTable, {
			target: [
				mockSqliteTable.int,
				mockSqliteTable.int2,
				mockSqliteTable.int3,
				mockSqliteTable.int4,
			],
		});
		expect(result).toStrictEqual({});
	});

	it("should handle keeping the primary key explicitly", () => {
		const result = onConflictDoUpdateSet(mockSqliteTable, {
			keep: [mockSqliteTable.int, mockSqliteTable.int2],
		});
		// Primary key should still be excluded even if in keep
		expect(result).not.toHaveProperty("int");
		expect(result).toHaveProperty("int2");
	});

	it("should handle excluding all non-pk columns", () => {
		const result = onConflictDoUpdateSet(mockSqliteTable, {
			exclude: [
				mockSqliteTable.int2,
				mockSqliteTable.int3,
				mockSqliteTable.int4,
			],
		});
		expect(result).toStrictEqual({});
	});

	it("should handle overlapping keep and exclude with same column", () => {
		const result = onConflictDoUpdateSet(mockSqliteTable, {
			keep: [mockSqliteTable.int2],
			exclude: [mockSqliteTable.int2],
		});
		// Exclude should take precedence
		expect(result).toStrictEqual({});
	});
});
