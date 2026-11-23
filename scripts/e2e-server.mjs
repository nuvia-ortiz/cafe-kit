// Starts the built app on a throwaway database so every e2e run begins from the same demo data.
import { rmSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const dir = path.resolve("test-results", "db");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
const port = process.env.PORT ?? "3200";
const child = spawn(process.execPath, [path.resolve("node_modules/next/dist/bin/next"), "start", "-p", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: "file:" + path.join(dir, "e2e.db"),
    PUBLIC_URL: `http://localhost:${port}`,
    INSECURE_COOKIES: "true",
  },
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 0));
