import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
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
