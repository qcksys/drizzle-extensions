import { describe, expect, it } from "bun:test";
import {
	onDuplicateKeyUpdateConfig,
	onDuplicateKeyUpdateSet,
} from "../src/onDuplicateKeyUpdate";

describe("should", () => {
	it("export onDuplicateKeyUpdateConfig", () => {
		expect(onDuplicateKeyUpdateConfig).toBeDefined();
	});
	it("export onDuplicateKeyUpdateSet", () => {
		expect(onDuplicateKeyUpdateSet).toBeDefined();
	});
});
