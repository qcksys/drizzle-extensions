import { describe, expect, it } from "bun:test";
import { sql } from "drizzle-orm";
import {
	onDuplicateKeyUpdateConfig,
	onDuplicateKeyUpdateSet,
} from "../src/onDuplicateKeyUpdate";
import { mockMysqlTable, mockMysqlTableUnique } from "./mock/mysql.ts";

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
});
