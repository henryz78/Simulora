export type ObjectMetadata = {
  key: string;
  checksum: string;
  contentType: string;
};

export interface ObjectStoragePort {
  put(metadata: ObjectMetadata, body: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
}

export class InMemoryObjectStorage implements ObjectStoragePort {
  readonly #objects = new Map<string, Uint8Array>();

  put(metadata: ObjectMetadata, body: Uint8Array): Promise<void> {
    this.#objects.set(metadata.key, body.slice());
    return Promise.resolve();
  }

  get(key: string): Promise<Uint8Array | null> {
    return Promise.resolve(this.#objects.get(key)?.slice() ?? null);
  }
}
