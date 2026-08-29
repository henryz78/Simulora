import { describe, expect, it } from "vitest";
import { InMemoryObjectStorage } from "./index.js";

describe("in-memory object storage", () => {
  it("copies object bytes across the port", async () => {
    const storage = new InMemoryObjectStorage();
    await storage.put(
      { key: "health.txt", checksum: "test", contentType: "text/plain" },
      new Uint8Array([1, 2]),
    );
    expect(await storage.get("health.txt")).toEqual(new Uint8Array([1, 2]));
  });
});
