import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type ObjectMetadata = {
  key: string;
  /** Hex SHA-256 of the body. PostgreSQL keeps the authoritative copy. */
  checksum: string;
  contentType: string;
};

export interface ObjectStoragePort {
  readonly kind: "memory" | "filesystem" | "s3";
  put(metadata: ObjectMetadata, body: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
  /** Deleting an absent key succeeds, so a retried purge is safe. */
  delete(key: string): Promise<void>;
}

/**
 * The store could not be reached or refused the request. Callers treat this as a
 * visible delay, never as a missing object and never as a core-state failure.
 */
export class ObjectStoreUnavailableError extends Error {
  override readonly name = "ObjectStoreUnavailableError";
}

/** The bytes the store holds no longer match the checksum they were written with. */
export class ObjectIntegrityError extends Error {
  override readonly name = "ObjectIntegrityError";
}

const objectKeyPattern = /^[A-Za-z0-9][A-Za-z0-9/_.-]{0,1023}$/;

// Keys are always composed server-side, but the port still refuses anything that
// could escape a prefix or a filesystem root if a caller ever regresses.
export function assertObjectKey(key: string): void {
  if (!objectKeyPattern.test(key) || key.split("/").some((part) => part === ".." || !part)) {
    throw new Error("Invalid object key");
  }
}

export function sha256Hex(body: Uint8Array): string {
  return createHash("sha256").update(body).digest("hex");
}

function assertChecksum(metadata: ObjectMetadata, body: Uint8Array): void {
  if (sha256Hex(body) !== metadata.checksum) {
    throw new ObjectIntegrityError("Object body does not match its declared checksum");
  }
}

export class InMemoryObjectStorage implements ObjectStoragePort {
  readonly kind = "memory" as const;
  readonly #objects = new Map<string, Uint8Array>();
  #available = true;

  /** Fault injection for the object-store outage drill. */
  setAvailable(available: boolean): void {
    this.#available = available;
  }

  has(key: string): boolean {
    return this.#objects.has(key);
  }

  keys(): string[] {
    return [...this.#objects.keys()].sort();
  }

  #assertAvailable(): void {
    if (!this.#available) throw new ObjectStoreUnavailableError("Object store is unavailable");
  }

  // Failures reject rather than throw, matching every networked adapter.
  put(metadata: ObjectMetadata, body: Uint8Array): Promise<void> {
    return this.#settle(() => {
      assertObjectKey(metadata.key);
      this.#assertAvailable();
      assertChecksum(metadata, body);
      this.#objects.set(metadata.key, body.slice());
    });
  }

  get(key: string): Promise<Uint8Array | null> {
    return this.#settle(() => {
      assertObjectKey(key);
      this.#assertAvailable();
      return this.#objects.get(key)?.slice() ?? null;
    });
  }

  delete(key: string): Promise<void> {
    return this.#settle(() => {
      assertObjectKey(key);
      this.#assertAvailable();
      this.#objects.delete(key);
    });
  }

  #settle<T>(work: () => T): Promise<T> {
    try {
      return Promise.resolve(work());
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * Local development store shared by the API and worker processes on one machine.
 * Writes go through a temporary file and a rename so a reader never sees a
 * half-written artifact.
 */
export class FileSystemObjectStorage implements ObjectStoragePort {
  readonly kind = "filesystem" as const;

  constructor(private readonly root: string) {}

  #pathFor(key: string): string {
    assertObjectKey(key);
    const resolved = path.resolve(this.root, ...key.split("/"));
    if (!resolved.startsWith(path.resolve(this.root) + path.sep)) {
      throw new Error("Invalid object key");
    }
    return resolved;
  }

  async put(metadata: ObjectMetadata, body: Uint8Array): Promise<void> {
    const target = this.#pathFor(metadata.key);
    assertChecksum(metadata, body);
    await mkdir(path.dirname(target), { recursive: true });
    const temporary = `${target}.${randomUUID()}.tmp`;
    await writeFile(temporary, body);
    await rename(temporary, target);
  }

  async get(key: string): Promise<Uint8Array | null> {
    try {
      return new Uint8Array(await readFile(this.#pathFor(key)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.#pathFor(key), { force: true });
  }
}

export type S3ObjectStorageOptions = {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  /** MinIO and most self-hosted S3 implementations need path-style addressing. */
  forcePathStyle?: boolean;
  requestTimeoutMs?: number;
};

function isNotFound(error: unknown): boolean {
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === "NoSuchKey" || candidate.$metadata?.httpStatusCode === 404;
}

function unavailable(error: unknown): ObjectStoreUnavailableError {
  // Keep only the class of failure; provider messages can echo request details.
  const name = (error as { name?: string }).name ?? "UnknownError";
  return new ObjectStoreUnavailableError(`Object store request failed (${name})`);
}

/**
 * Upper bounds on one S3 call: each attempt may spend a connection and a request
 * timeout. The export upload lease must outlast them, because an expired lease is
 * taken to mean its upload can no longer land (see `exportStorageLeaseMs`).
 */
export const s3RequestTimeoutMs = 5000;
export const s3MaxAttempts = 2;
export const s3WorstCaseCallMs = s3MaxAttempts * 2 * s3RequestTimeoutMs;

export class S3ObjectStorage implements ObjectStoragePort {
  readonly kind = "s3" as const;
  readonly #client: S3Client;
  readonly #bucket: string;

  constructor(options: S3ObjectStorageOptions) {
    this.#bucket = options.bucket;
    // Never longer than the bound the upload lease is sized against.
    const timeout = Math.min(options.requestTimeoutMs ?? s3RequestTimeoutMs, s3RequestTimeoutMs);
    this.#client = new S3Client({
      region: options.region,
      ...(options.endpoint ? { endpoint: options.endpoint } : {}),
      forcePathStyle: options.forcePathStyle ?? Boolean(options.endpoint),
      ...(options.accessKeyId && options.secretAccessKey
        ? {
            credentials: {
              accessKeyId: options.accessKeyId,
              secretAccessKey: options.secretAccessKey,
            },
          }
        : {}),
      // An outage has to surface as a bounded, visible delay rather than a hung request.
      requestHandler: { connectionTimeout: timeout, requestTimeout: timeout },
      maxAttempts: s3MaxAttempts,
    });
  }

  /** Local and CI bootstrap only; production buckets are provisioned by operations. */
  async ensureBucket(): Promise<void> {
    try {
      await this.#client.send(new HeadBucketCommand({ Bucket: this.#bucket }));
    } catch (error) {
      if (!isNotFound(error)) throw unavailable(error);
      await this.#client.send(new CreateBucketCommand({ Bucket: this.#bucket }));
    }
  }

  async put(metadata: ObjectMetadata, body: Uint8Array): Promise<void> {
    assertObjectKey(metadata.key);
    assertChecksum(metadata, body);
    try {
      await this.#client.send(
        new PutObjectCommand({
          Bucket: this.#bucket,
          Key: metadata.key,
          Body: body,
          ContentType: metadata.contentType,
          // The store verifies the digest on receipt, so a corrupted upload fails here.
          ChecksumSHA256: Buffer.from(metadata.checksum, "hex").toString("base64"),
          Metadata: { sha256: metadata.checksum },
        }),
      );
    } catch (error) {
      throw unavailable(error);
    }
  }

  async get(key: string): Promise<Uint8Array | null> {
    assertObjectKey(key);
    try {
      const result = await this.#client.send(
        new GetObjectCommand({ Bucket: this.#bucket, Key: key }),
      );
      return result.Body ? await result.Body.transformToByteArray() : null;
    } catch (error) {
      if (isNotFound(error)) return null;
      throw unavailable(error);
    }
  }

  async delete(key: string): Promise<void> {
    assertObjectKey(key);
    try {
      await this.#client.send(new DeleteObjectCommand({ Bucket: this.#bucket, Key: key }));
    } catch (error) {
      if (isNotFound(error)) return;
      throw unavailable(error);
    }
  }

  destroy(): void {
    this.#client.destroy();
  }
}

export type ObjectStorageFactoryOptions =
  | ({ adapter: "s3" } & Omit<
      S3ObjectStorageOptions,
      "endpoint" | "accessKeyId" | "secretAccessKey"
    > & {
        endpoint: string | undefined;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
      })
  | { adapter: "filesystem"; directory: string }
  | { adapter: "memory" };

export function createObjectStorage(options: ObjectStorageFactoryOptions): ObjectStoragePort {
  if (options.adapter === "memory") return new InMemoryObjectStorage();
  if (options.adapter === "filesystem") return new FileSystemObjectStorage(options.directory);
  return new S3ObjectStorage({
    region: options.region,
    bucket: options.bucket,
    ...(options.endpoint ? { endpoint: options.endpoint } : {}),
    ...(options.accessKeyId ? { accessKeyId: options.accessKeyId } : {}),
    ...(options.secretAccessKey ? { secretAccessKey: options.secretAccessKey } : {}),
  });
}
