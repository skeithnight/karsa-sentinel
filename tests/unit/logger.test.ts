import { describe, it, expect, vi } from "vitest";
import { logger } from "../../src/core/logger/index.js";

describe("SentinelLogger", () => {
  it("should enable and disable debug mode", () => {
    logger.setDebug(true);
    expect(logger.isDebug()).toBe(true);

    logger.setDebug(false);
    expect(logger.isDebug()).toBe(false);
  });

  it("should format debug messages when debug is enabled", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.setDebug(true);

    logger.debug("TEST_CAT", "Test debug message", { foo: "bar" });
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
    logger.setDebug(false);
  });
});
