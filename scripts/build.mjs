import { chmod, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { build } from "esbuild";

const distDir = path.resolve("dist");

await rm(distDir, { recursive: true, force: true });

await build({
  entryPoints: ["src/cli.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  packages: "external",
  outfile: "dist/cli.js",
});

await writeFile(
  path.join(distDir, "cli.cjs"),
  [
    "#!/usr/bin/env node",
    "",
    'import("./cli.js").catch((error) => {',
    '  process.stderr.write(`\\n[portki] error: ${String(error)}\\n`);',
    "  process.exitCode = 1;",
    "});",
    "",
  ].join("\n"),
  "utf8",
);

await chmod(path.join(distDir, "cli.cjs"), 0o755);
