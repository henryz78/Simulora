import { describe, expect, it } from "vitest";
import { describeFoundation, ExportStorageWorker, type ExportArtifactStore } from "./index.js";

describe("describeFoundation", () => {
  it("reports the IP-9 hardening phase honestly", () => {
    const response = describeFoundation([{ name: "database", configured: true }]);
    expect(response.productImplementationPhase).toBe("IP-9");
    expect(response.productSemanticsStarted).toBe(true);
    expect(response.capabilities).toEqual([{ name: "database", status: "configured" }]);
  });
});

describe("ExportStorageWorker reconciliation", () => {
  it("claims queue work before an inventory failure can block it", async () => {
    let claimed = false;
    const storage: ExportArtifactStore = {
      kind: "test",
      put: () => Promise.resolve(),
      get: () => Promise.resolve(null),
      list: () => Promise.reject(new Error("inventory unavailable")),
      delete: () => Promise.resolve(),
    };
    const port = {
      claimExportStorageWork: () => {
        claimed = true;
        return Promise.resolve(null);
      },
      listExportObjectKeys: () => Promise.resolve([]),
      markExportStored: () => Promise.resolve("STORED" as const),
      recordExportStorageDelay: () => Promise.resolve(),
      markExportObjectDeleted: () => Promise.resolve(),
    };
    await expect(new ExportStorageWorker(port, storage).processNext()).rejects.toThrow(
      "inventory unavailable",
    );
    expect(claimed).toBe(true);
  });

  it("takes the object and database snapshots in a safe order", async () => {
    let listed = false;
    const deleted: string[] = [];
    const storage: ExportArtifactStore = {
      kind: "test",
      put: () => Promise.resolve(),
      get: () => Promise.resolve(null),
      list: async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        listed = true;
        return ["exports/new.zip"];
      },
      delete: (key) => {
        deleted.push(key);
        return Promise.resolve();
      },
    };
    const port = {
      claimExportStorageWork: () => Promise.resolve(null),
      listExportObjectKeys: () => Promise.resolve(listed ? ["exports/new.zip"] : []),
      markExportStored: () => Promise.resolve("STORED" as const),
      recordExportStorageDelay: () => Promise.resolve(),
      markExportObjectDeleted: () => Promise.resolve(),
    };
    await new ExportStorageWorker(port, storage).processNext();
    expect(deleted).toEqual([]);
  });

  it("does not overlap inventory polls", async () => {
    let active = 0;
    let maxActive = 0;
    const storage: ExportArtifactStore = {
      kind: "test",
      put: () => Promise.resolve(),
      get: () => Promise.resolve(null),
      list: async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active -= 1;
        return [];
      },
      delete: () => Promise.resolve(),
    };
    const port = {
      claimExportStorageWork: () => Promise.resolve(null),
      listExportObjectKeys: () => Promise.resolve([]),
      markExportStored: () => Promise.resolve("STORED" as const),
      recordExportStorageDelay: () => Promise.resolve(),
      markExportObjectDeleted: () => Promise.resolve(),
    };
    const worker = new ExportStorageWorker(port, storage);
    await Promise.all([worker.processNext(), worker.processNext()]);
    expect(maxActive).toBe(1);
  });
});
