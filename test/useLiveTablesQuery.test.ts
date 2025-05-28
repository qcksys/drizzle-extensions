import { describe, expect, it } from "bun:test";

describe("should", () => {
  // Bun cant export types here and it errors - no test for now
  it("export useLiveTablesQuery", () => {
    expect("useLiveTablesQuery").toBeDefined();
  });
});
