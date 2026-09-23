import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertObjectKey,
  createObjectStorage,
  FileSystemObjectStorage,
  InMemoryObjectStorage,
  ObjectIntegrityError,
  ObjectStoreUnavailableError,
  S3ObjectStorage,
  sha256Hex,
} from "./index.js";

const body = new Uint8Array([1, 2, 3]);
const metadata = (key: string) => ({
  key,
  checksum: sha256Hex(body),
  contentType: "application/zip",
});

describe("in-memory object storage", () => {
  it("copies object bytes across the port", async () => {
    const storage = new InMemoryObjectStorage();
    await storage.put(metadata("health.txt"), body);
    expect(await storage.get("health.txt")).toEqual(body);
    await storage.delete("health.txt");
    await storage.delete("health.txt");
    expect(await storage.get("health.txt")).toBeNull();
  });

  it("refuses a body that does not match its declared checksum", async () => {
    const storage = new InMemoryObjectStorage();
    await expect(
      storage.put({ ...metadata("exports/a.zip"), checksum: "0".repeat(64) }, body),
    ).rejects.toBeInstanceOf(ObjectIntegrityError);
    expect(storage.keys()).toEqual([]);
  });

  it("injects an outage as a typed unavailable error", async () => {
    const storage = new InMemoryObjectStorage();
    storage.setAvailable(false);
    await expect(storage.put(metadata("exports/a.zip"), body)).rejects.toBeInstanceOf(
      ObjectStoreUnavailableError,
    );
    await expect(storage.get("exports/a.zip")).rejects.toBeInstanceOf(ObjectStoreUnavailableError);
  });
});

describe("object keys", () => {
  it("rejects keys that could escape a prefix or root", () => {
    for (const key of ["", "/abs", "../x", "a/../b", "a//b", "a b", "exports/\u0000"]) {
      expect(() => assertObjectKey(key), key).toThrow("Invalid object key");
    }
    expect(() => assertObjectKey("exports/account/export-1.zip")).not.toThrow();
  });
});

describe("filesystem object storage", () => {
  it("writes atomically, reads back and deletes idempotently", async () => {
    const root = path.join(tmpdir(), `simulora-objects-${randomUUID()}`);
    const storage = new FileSystemObjectStorage(root);
    await storage.put(metadata("exports/account/one.zip"), body);
    expect(await storage.get("exports/account/one.zip")).toEqual(body);
    // No temporary file survives a completed write.
    expect(await readdir(path.join(root, "exports", "account"))).toEqual(["one.zip"]);
    await storage.delete("exports/account/one.zip");
    await storage.delete("exports/account/one.zip");
    expect(await storage.get("exports/account/one.zip")).toBeNull();
  });
});

describe("object storage factory", () => {
  it("builds the adapter the configuration selected", () => {
    expect(createObjectStorage({ adapter: "memory" }).kind).toBe("memory");
    expect(createObjectStorage({ adapter: "filesystem", directory: tmpdir() }).kind).toBe(
      "filesystem",
    );
    const s3 = createObjectStorage({
      adapter: "s3",
      endpoint: "http://127.0.0.1:9000",
      region: "local",
      bucket: "simulora-test",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
    expect(s3).toBeInstanceOf(S3ObjectStorage);
    (s3 as S3ObjectStorage).destroy();
  });

  it("signs a short-lived, single-object S3 download URL without network access", async () => {
    const storage = new S3ObjectStorage({
      endpoint: "http://127.0.0.1:9000",
      region: "us-east-1",
      bucket: "simulora-test",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
    const url = new URL(
      await storage.signedDownloadUrl("exports/account/one.zip", {
        expiresInSeconds: 120,
        filename: "one.zip",
      }),
    );
    expect(url.pathname).toBe("/simulora-test/exports/account/one.zip");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("120");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
    expect(url.toString()).not.toContain("secret");
    storage.destroy();
  });
});
