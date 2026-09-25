import { randomUUID } from "node:crypto";
import { readdir } from "node:fs/promises";
import { createServer } from "node:http";
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

  it("lists only objects under the requested export prefix", async () => {
    const storage = new InMemoryObjectStorage();
    await storage.put(metadata("exports/a.zip"), body);
    await storage.put(metadata("other.zip"), body);
    expect(await storage.list("exports/")).toEqual(["exports/a.zip"]);
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
});

describe("S3 request bounds", () => {
  it("aborts a stalled request instead of outliving its upload lease", async () => {
    const server = createServer(() => undefined);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP test server");
    const storage = new S3ObjectStorage({
      endpoint: `http://127.0.0.1:${address.port}`,
      region: "local",
      bucket: "simulora-test",
      accessKeyId: "key",
      secretAccessKey: "secret",
      requestTimeoutMs: 50,
    });
    const startedAt = Date.now();
    try {
      await expect(storage.put(metadata("exports/stalled.zip"), body)).rejects.toBeInstanceOf(
        ObjectStoreUnavailableError,
      );
      expect(Date.now() - startedAt).toBeLessThan(1000);
    } finally {
      storage.destroy();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it("aborts a slow-trickle upload after its total timeout", async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "application/octet-stream" });
      const interval = setInterval(() => response.write(Buffer.from([1])), 5);
      response.on("close", () => clearInterval(interval));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP test server");
    const storage = new S3ObjectStorage({
      endpoint: `http://127.0.0.1:${address.port}`,
      region: "local",
      bucket: "simulora-test",
      accessKeyId: "key",
      secretAccessKey: "secret",
      requestTimeoutMs: 50,
    });
    const startedAt = Date.now();
    try {
      await expect(storage.put(metadata("exports/trickle-put.zip"), body)).rejects.toBeInstanceOf(
        ObjectStoreUnavailableError,
      );
      expect(Date.now() - startedAt).toBeLessThan(1000);
    } finally {
      storage.destroy();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it("aborts a slow-trickle response while its body is still streaming", async () => {
    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "application/octet-stream" });
      const interval = setInterval(() => response.write(Buffer.from([1])), 5);
      response.on("close", () => clearInterval(interval));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP test server");
    const storage = new S3ObjectStorage({
      endpoint: `http://127.0.0.1:${address.port}`,
      region: "local",
      bucket: "simulora-test",
      accessKeyId: "key",
      secretAccessKey: "secret",
      requestTimeoutMs: 50,
    });
    const startedAt = Date.now();
    try {
      await expect(storage.get("exports/trickle.zip")).rejects.toBeInstanceOf(
        ObjectStoreUnavailableError,
      );
      expect(Date.now() - startedAt).toBeLessThan(1000);
    } finally {
      storage.destroy();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects an invalid request timeout (%s)",
    (requestTimeoutMs) => {
      expect(
        () =>
          new S3ObjectStorage({
            endpoint: "http://127.0.0.1:9000",
            region: "local",
            bucket: "simulora-test",
            requestTimeoutMs,
          }),
      ).toThrow("requestTimeoutMs must be a positive finite number");
    },
  );
});
