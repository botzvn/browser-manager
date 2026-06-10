import fs from "node:fs";
import { spawn } from "node:child_process";
import { ensureDir } from "../utils/fs.js";

export async function spawnLogged(command, args, { env, cwd, logPath }) {
  await ensureDir(logPath.substring(0, logPath.lastIndexOf("/")));
  const log = fs.openSync(logPath, "a");
  const child = spawn(command, args, {
    cwd,
    env,
    detached: true,
    stdio: ["ignore", log, log],
  });
  child.once("exit", () => {
    try {
      fs.closeSync(log);
    } catch {
      // ignore close races
    }
  });
  return child;
}

export async function stopProcessTree(child, name, timeoutMs = 5000) {
  if (!child || child.exitCode !== null || child.signalCode) return;
  const pid = child.pid;
  const waitExit = () =>
    new Promise((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      child.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });

  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      return;
    }
  }

  await waitExit();
  if (child.exitCode === null && !child.signalCode) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // already gone
      }
    }
  }
}

export function assertExecutable(filePath, label) {
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
  } catch {
    throw new Error(`${label} is not executable: ${filePath}`);
  }
}
