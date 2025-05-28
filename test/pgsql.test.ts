import { describe, expect, it } from "bun:test";
import {
  buildOnConflictDoUpdate,
  onConflictDoUpdateConfig,
} from "../src/pgsql";

describe("should", () => {
  it("export buildOnConflictDoUpdate", () => {
    expect(buildOnConflictDoUpdate).toBeDefined();
  });
  it("export onConflictDoUpdateConfig", () => {
    expect(onConflictDoUpdateConfig).toBeDefined();
  });
});
