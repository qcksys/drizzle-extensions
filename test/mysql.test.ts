import { describe, expect, it } from "bun:test";
import {
  buildConflictUpdateColumns,
  onDuplicateKeyUpdateConfig,
} from "../src/mysql";

describe("should", () => {
  it("export buildConflictUpdateColumns", () => {
    expect(buildConflictUpdateColumns).toBeDefined();
  });
  it("export onDuplicateKeyUpdateConfig", () => {
    expect(onDuplicateKeyUpdateConfig).toBeDefined();
  });
});
