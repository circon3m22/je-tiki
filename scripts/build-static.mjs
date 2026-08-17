import { renameSync } from "node:fs";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiDirectory = path.join(root, "app", "api");
const parkedApiDirectory = path.join(root, ".pages-api");

// GitHub Pages can only host static files. Keep the server route sources intact,
// but leave them out while Next.js creates the Pages artifact.
renameSync(apiDirectory, parkedApiDirectory);

try {
  const result = spawnSync(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "build"],
    {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  renameSync(parkedApiDirectory, apiDirectory);
}
