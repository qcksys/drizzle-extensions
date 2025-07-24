import { describe, expect, it } from "bun:test";
import {
	onConflictDoUpdateConfig,
	onConflictDoUpdateSet,
	onConflictDoUpdateTarget,
} from "../src/onConflictDoUpdate.ts";

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
