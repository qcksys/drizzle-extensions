import { describe, expect, it } from "bun:test";
import {
  buildOnDuplicateKeyUpdate,
  onDuplicateKeyUpdateConfig,
} from "../src/mysql";

describe("should", () => {
  it("export buildOnDuplicateKeyUpdate", () => {
    expect(buildOnDuplicateKeyUpdate).toBeDefined();
  });
  it("export onDuplicateKeyUpdateConfig", () => {
    expect(onDuplicateKeyUpdateConfig).toBeDefined();
  });
});
