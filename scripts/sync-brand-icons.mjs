import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const psScriptPath = join(root, "scripts", "sync-brand-icons.ps1");

if (!existsSync(psScriptPath)) {
  console.error(`Icon sync script missing: ${psScriptPath}`);
  process.exit(1);
}

if (process.platform !== "win32") {
  console.log("icons:sync skipped on non-Windows environment; existing icons retained.");
  process.exit(0);
}

const runners = [
  { command: "powershell", args: ["-ExecutionPolicy", "Bypass", "-File", psScriptPath] },
  { command: "powershell.exe", args: ["-ExecutionPolicy", "Bypass", "-File", psScriptPath] },
  { command: "pwsh", args: ["-File", psScriptPath] },
];

for (const runner of runners) {
  const result = spawnSync(runner.command, runner.args, { stdio: "inherit" });
  if (!result.error && result.status === 0) {
    process.exit(0);
  }
}

console.error("icons:sync failed: PowerShell runtime not available.");
process.exit(1);
