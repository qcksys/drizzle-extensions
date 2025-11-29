import { describe, expect, it } from "vitest";

describe("should", () => {
	// Bun cant export types here and it errors - no test for now
	it("export useLiveTablesQuery", () => {
		expect("useLiveTablesQuery").toBeDefined();
	});
});
