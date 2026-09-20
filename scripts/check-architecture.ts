import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const roots = ["apps", "packages", "scripts", "tests"];
const violations: string[] = [];

const allowedInternalImports: Record<string, ReadonlySet<string>> = {
  "apps/web": new Set(["@simulora/contracts", "@simulora/ui"]),
  "apps/api": new Set([
    "@simulora/application",
    "@simulora/auth",
    "@simulora/config",
    "@simulora/contracts",
    "@simulora/database",
    "@simulora/model-gateway",
    "@simulora/observability",
    "@simulora/storage",
  ]),
  "apps/worker": new Set([
    "@simulora/application",
    "@simulora/config",
    "@simulora/contracts",
    "@simulora/database",
    "@simulora/jobs",
    "@simulora/model-gateway",
    "@simulora/observability",
    "@simulora/storage",
  ]),
  "packages/contracts": new Set(),
  "packages/domain": new Set(),
  "packages/application": new Set(["@simulora/contracts", "@simulora/domain"]),
  "packages/config": new Set(),
  "packages/auth": new Set(),
  "packages/model-gateway": new Set(),
  "packages/storage": new Set(),
  "packages/observability": new Set(),
  "packages/database": new Set(["@simulora/config", "@simulora/domain"]),
  "packages/jobs": new Set(["@simulora/domain"]),
  "packages/ui": new Set(),
  "packages/testkit": new Set(["@simulora/domain"]),
};

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (["dist", "node_modules", "coverage"].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function ownerFor(file: string): string | undefined {
  const relative = path.relative(repositoryRoot, file).replaceAll("\\", "/");
  return Object.keys(allowedInternalImports).find((owner) => relative.startsWith(`${owner}/`));
}

for (const root of roots) {
  const directory = path.join(repositoryRoot, root);
  const files = await walk(directory);
  for (const file of files) {
    const content = await readFile(file, "utf8");
    const relative = path.relative(repositoryRoot, file).replaceAll("\\", "/");
    const owner = ownerFor(file);
    if (!owner) continue;
    if (/prototypes\/simulora-experience/.test(content)) {
      violations.push(`${relative}: production source references the frozen Prototype`);
    }
    for (const match of content.matchAll(/from\s+["'](@simulora\/[^"']+)["']/g)) {
      const imported = match[1];
      if (imported && !allowedInternalImports[owner]?.has(imported)) {
        violations.push(`${relative}: ${owner} may not import ${imported}`);
      }
    }
  }
}

// A file under tests/ resolves its bare imports against the ROOT manifest. A
// package that only a workspace package depends on may still resolve locally,
// because an accumulated node_modules hoists it, and then fail on a clean CI
// install. Check it here so that class of mistake cannot reach CI again.
const rootManifest = JSON.parse(
  await readFile(path.join(repositoryRoot, "package.json"), "utf8"),
) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
const rootDependencies = new Set([
  ...Object.keys(rootManifest.dependencies ?? {}),
  ...Object.keys(rootManifest.devDependencies ?? {}),
]);
for (const file of await walk(path.join(repositoryRoot, "tests"))) {
  const content = await readFile(file, "utf8");
  const relative = path.relative(repositoryRoot, file).replaceAll("\\", "/");
  for (const match of content.matchAll(/from\s+["']([^"'.][^"']*)["']/g)) {
    const imported = match[1];
    if (!imported || imported.startsWith("node:") || imported.startsWith("@simulora/")) continue;
    const packageName = imported.startsWith("@")
      ? imported.split("/").slice(0, 2).join("/")
      : imported.split("/")[0];
    if (packageName && !rootDependencies.has(packageName)) {
      violations.push(
        `${relative}: imports ${packageName}, which the root package.json does not declare`,
      );
    }
  }
}

if (violations.length > 0) throw new Error(`Architecture violations:\n${violations.join("\n")}`);
console.log("Architecture boundary check passed");
