import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
	onDuplicateKeyUpdateConfig,
	onDuplicateKeyUpdateSet,
} from "~/onDuplicateKeyUpdate.ts";
import {
	mockMysqlTable,
	mockMysqlTableComposite,
	mockMysqlTableMultiUnique,
	mockMysqlTableUnique,
} from "~test/unit/mock/mysql.ts";
import {
	mockSinglestoreTable,
	mockSinglestoreTableMultiUnique,
	mockSinglestoreTableUnique,
} from "~test/unit/mock/singlestore.ts";

describe("should", () => {
	it("export onDuplicateKeyUpdateConfig", () => {
		expect(onDuplicateKeyUpdateConfig).toBeDefined();
	});
	it("export onDuplicateKeyUpdateSet", () => {
		expect(onDuplicateKeyUpdateSet).toBeDefined();
	});
	it("should generate the appropriate set for non composite pk", () => {
		expect(onDuplicateKeyUpdateSet(mockMysqlTable)).toStrictEqual({
			int2: sql.raw(`values(int2)`),
			int3: sql.raw(`values(int3)`),
			int4: sql.raw(`values(int4)`),
		});
	});
	it("should generate the appropriate set for manually set exclude", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTable, { exclude: mockMysqlTable.int2 }),
		).toStrictEqual({
			int3: sql.raw(`values(int3)`),
			int4: sql.raw(`values(int4)`),
		});
	});
	it("should generate the appropriate set for manually set keep", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTable, { keep: mockMysqlTable.int2 }),
		).toStrictEqual({
			int2: sql.raw(`values(int2)`),
		});
	});
	it("should generate the appropriate set for for non composite uk", () => {
		expect(onDuplicateKeyUpdateSet(mockMysqlTableUnique)).toStrictEqual({
			int2: sql.raw(`values(int2)`),
			int4: sql.raw(`values(int4)`),
		});
	});
	it("should generate the appropriate set for for non composite uk with manually set exclude", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTableUnique, {
				exclude: [mockMysqlTableUnique.int4],
			}),
		).toStrictEqual({
			int2: sql.raw(`values(int2)`),
		});
	});
	it("should generate the appropriate set for for non composite uk with manually set keep", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTableUnique, {
				keep: [
					mockMysqlTableUnique.int,
					mockMysqlTableUnique.int2,
					mockMysqlTableUnique.int4,
				],
			}),
		).toStrictEqual({
			int: sql.raw(`values(int)`),
			int2: sql.raw(`values(int2)`),
			int4: sql.raw(`values(int4)`),
		});
	});
	it("should generate the appropriate config for non composite pk", () => {
		expect(onDuplicateKeyUpdateConfig(mockMysqlTable)).toStrictEqual({
			set: {
				int2: sql.raw(`values(int2)`),
				int3: sql.raw(`values(int3)`),
				int4: sql.raw(`values(int4)`),
			},
		});
	});
	it("should handle empty exclude array", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTable, { exclude: [] }),
		).toStrictEqual({
			int2: sql.raw(`values(int2)`),
			int3: sql.raw(`values(int3)`),
			int4: sql.raw(`values(int4)`),
		});
	});
	it("should handle empty keep array", () => {
		expect(onDuplicateKeyUpdateSet(mockMysqlTable, { keep: [] })).toStrictEqual(
			{
				int2: sql.raw(`values(int2)`),
				int3: sql.raw(`values(int3)`),
				int4: sql.raw(`values(int4)`),
			},
		);
	});
	it("should handle single column exclude parameter", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTable, { exclude: mockMysqlTable.int2 }),
		).toStrictEqual({
			int3: sql.raw(`values(int3)`),
			int4: sql.raw(`values(int4)`),
		});
	});
	it("should handle single column keep parameter", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTable, { keep: mockMysqlTable.int2 }),
		).toStrictEqual({
			int2: sql.raw(`values(int2)`),
		});
	});
	it("should handle both exclude and keep options together (keep overrides exclude)", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTable, {
				keep: [mockMysqlTable.int2, mockMysqlTable.int3],
				exclude: [mockMysqlTable.int3],
			}),
		).toStrictEqual({
			int2: sql.raw(`values(int2)`),
			int3: sql.raw(`values(int3)`),
		});
	});
	it("should include primary key when explicitly kept", () => {
		expect(
			onDuplicateKeyUpdateSet(mockMysqlTable, {
				keep: [mockMysqlTable.int, mockMysqlTable.int2],
			}),
		).toStrictEqual({
			int: sql.raw(`values(int)`),
			int2: sql.raw(`values(int2)`),
		});
	});
	it("should handle config with empty options", () => {
		expect(onDuplicateKeyUpdateConfig(mockMysqlTable, {})).toStrictEqual({
			set: {
				int2: sql.raw(`values(int2)`),
				int3: sql.raw(`values(int3)`),
				int4: sql.raw(`values(int4)`),
			},
		});
	});
	it("should handle config with single column parameters", () => {
		expect(
			onDuplicateKeyUpdateConfig(mockMysqlTable, {
				keep: mockMysqlTable.int2,
				exclude: mockMysqlTable.int3,
			}),
		).toStrictEqual({
			set: {
				int2: sql.raw(`values(int2)`),
			},
		});
	});
});

describe("SingleStore tables", () => {
	describe("onDuplicateKeyUpdateSet", () => {
		it("should generate set for SingleStore table", () => {
			expect(onDuplicateKeyUpdateSet(mockSinglestoreTable)).toStrictEqual({
				int2: sql.raw(`values(int2)`),
				int3: sql.raw(`values(int3)`),
				int4: sql.raw(`values(int4)`),
			});
		});

		it("should exclude unique columns for SingleStore", () => {
			expect(onDuplicateKeyUpdateSet(mockSinglestoreTableUnique)).toStrictEqual(
				{
					int2: sql.raw(`values(int2)`),
					int4: sql.raw(`values(int4)`),
				},
			);
		});

		it("should handle keep option for SingleStore", () => {
			expect(
				onDuplicateKeyUpdateSet(mockSinglestoreTable, {
					keep: [mockSinglestoreTable.int2],
				}),
			).toStrictEqual({
				int2: sql.raw(`values(int2)`),
			});
		});

		it("should handle exclude option for SingleStore", () => {
			expect(
				onDuplicateKeyUpdateSet(mockSinglestoreTable, {
					exclude: [mockSinglestoreTable.int2],
				}),
			).toStrictEqual({
				int3: sql.raw(`values(int3)`),
				int4: sql.raw(`values(int4)`),
			});
		});
	});

	describe("onDuplicateKeyUpdateConfig", () => {
		it("should generate config for SingleStore table", () => {
			expect(onDuplicateKeyUpdateConfig(mockSinglestoreTable)).toStrictEqual({
				set: {
					int2: sql.raw(`values(int2)`),
					int3: sql.raw(`values(int3)`),
					int4: sql.raw(`values(int4)`),
				},
			});
		});
	});
});

describe("composite primary key tables", () => {
	describe("onDuplicateKeyUpdateSet", () => {
		it("should generate set excluding composite pk columns", () => {
			// For MySQL, we don't specify target - MySQL figures it out
			// But all non-pk columns should be in set by default
			const result = onDuplicateKeyUpdateSet(mockMysqlTableComposite);
			expect(result).toHaveProperty("name");
			expect(result).toHaveProperty("value");
		});

		it("should allow keeping specific columns with composite pk", () => {
			const result = onDuplicateKeyUpdateSet(mockMysqlTableComposite, {
				keep: [mockMysqlTableComposite.name],
			});
			expect(result).toStrictEqual({
				name: sql.raw(`values(name)`),
			});
		});

		it("should allow excluding columns with composite pk", () => {
			const result = onDuplicateKeyUpdateSet(mockMysqlTableComposite, {
				exclude: [mockMysqlTableComposite.value],
			});
			// MySQL composite pk columns are included unless excluded
			// The function includes id1, id2 and name (value is excluded)
			expect(result).toHaveProperty("name");
			expect(result).toHaveProperty("id1");
			expect(result).toHaveProperty("id2");
			expect(result).not.toHaveProperty("value");
		});
	});

	describe("onDuplicateKeyUpdateConfig", () => {
		it("should generate config for composite pk table", () => {
			const config = onDuplicateKeyUpdateConfig(mockMysqlTableComposite);
			expect(config.set).toHaveProperty("name");
			expect(config.set).toHaveProperty("value");
		});
	});
});

describe("multiple unique constraints", () => {
	describe("onDuplicateKeyUpdateSet", () => {
		it("should exclude all unique columns from set by default", () => {
			const result = onDuplicateKeyUpdateSet(mockMysqlTableMultiUnique);
			expect(result).toStrictEqual({
				name: sql.raw(`values(name)`),
			});
		});

		it("should work with SingleStore multi-unique tables", () => {
			const result = onDuplicateKeyUpdateSet(mockSinglestoreTableMultiUnique);
			expect(result).toStrictEqual({
				name: sql.raw(`values(name)`),
			});
		});

		it("should allow keeping unique columns explicitly", () => {
			const result = onDuplicateKeyUpdateSet(mockMysqlTableMultiUnique, {
				keep: [mockMysqlTableMultiUnique.email, mockMysqlTableMultiUnique.name],
			});
			expect(result).toStrictEqual({
				email: sql.raw(`values(email)`),
				name: sql.raw(`values(name)`),
			});
		});
	});

	describe("onDuplicateKeyUpdateConfig", () => {
		it("should generate config for multi-unique table", () => {
			const config = onDuplicateKeyUpdateConfig(mockMysqlTableMultiUnique);
			expect(config.set).toStrictEqual({
				name: sql.raw(`values(name)`),
			});
		});
	});
});

describe("edge cases", () => {
	it("should return empty set when all columns are pk/unique or excluded", () => {
		const result = onDuplicateKeyUpdateSet(mockMysqlTable, {
			exclude: [mockMysqlTable.int2, mockMysqlTable.int3, mockMysqlTable.int4],
		});
		expect(result).toStrictEqual({});
	});

	it("should handle overlapping keep and exclude - keep wins", () => {
		const result = onDuplicateKeyUpdateSet(mockMysqlTable, {
			keep: [mockMysqlTable.int2],
			exclude: [mockMysqlTable.int2],
		});
		// In MySQL onDuplicateKeyUpdate, keep overrides exclude
		expect(result).toStrictEqual({
			int2: sql.raw(`values(int2)`),
		});
	});

	it("should allow updating primary key explicitly in MySQL", () => {
		const result = onDuplicateKeyUpdateSet(mockMysqlTable, {
			keep: [mockMysqlTable.int],
		});
		expect(result).toStrictEqual({
			int: sql.raw(`values(int)`),
		});
	});

	it("should handle config with all columns excluded", () => {
		const config = onDuplicateKeyUpdateConfig(mockMysqlTable, {
			exclude: [mockMysqlTable.int2, mockMysqlTable.int3, mockMysqlTable.int4],
		});
		expect(config.set).toStrictEqual({});
	});
});
