import { describe, expect, it } from "bun:test";
import {
  buildOnDuplicateKeyUpdate,
  onDuplicateKeyUpdateConfig,
} from "../src/onDuplicateKeyUpdate";

describe("should", () => {
  it("export onDuplicateKeyUpdateConfig", () => {
    expect(onDuplicateKeyUpdateConfig).toBeDefined();
  });
  it("export buildOnDuplicateKeyUpdate", () => {
    expect(buildOnDuplicateKeyUpdate).toBeDefined();
  });
});
