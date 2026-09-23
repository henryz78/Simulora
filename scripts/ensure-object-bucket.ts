// Local and CI bootstrap for the S3-compatible export bucket. Production buckets
// are provisioned by operations with versioning and lifecycle policy, not here.
import { S3ObjectStorage } from "../packages/storage/src/index.js";

const endpoint = process.env.SIMULORA_OBJECT_ENDPOINT;
if (!endpoint) throw new Error("SIMULORA_OBJECT_ENDPOINT is required");
if (!["local", "test"].includes(process.env.SIMULORA_ENV ?? "local")) {
  throw new Error("Bucket bootstrap is only for local and test environments");
}
const storage = new S3ObjectStorage({
  endpoint,
  region: process.env.SIMULORA_OBJECT_REGION ?? "local",
  bucket: process.env.SIMULORA_OBJECT_BUCKET ?? "simulora-local",
  ...(process.env.SIMULORA_OBJECT_ACCESS_KEY
    ? { accessKeyId: process.env.SIMULORA_OBJECT_ACCESS_KEY }
    : {}),
  ...(process.env.SIMULORA_OBJECT_SECRET_KEY
    ? { secretAccessKey: process.env.SIMULORA_OBJECT_SECRET_KEY }
    : {}),
});
try {
  await storage.ensureBucket();
  console.log("Object bucket is ready");
} finally {
  storage.destroy();
}
