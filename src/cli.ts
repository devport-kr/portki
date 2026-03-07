import { main } from "./agent";

main().catch((error) => {
  process.stderr.write(`\n[portki] error: ${String(error)}\n`);
  process.exitCode = 1;
});
