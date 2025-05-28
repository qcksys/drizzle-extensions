import { describe, expect, it } from "bun:test";
import {
  buildOnConflictDoUpdate,
  onConflictDoUpdateConfig,
} from "../src/onConflictDoUpdate.ts";

describe("should", () => {
  it("export onConflictDoUpdateConfig", () => {
    expect(onConflictDoUpdateConfig).toBeDefined();
  });
  it("export buildOnConflictDoUpdate", () => {
    expect(buildOnConflictDoUpdate).toBeDefined();
  });
});
