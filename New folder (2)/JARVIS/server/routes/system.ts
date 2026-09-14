import { Router as createRouter } from "express";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);
export const systemRouter = createRouter();

systemRouter.post("/open", async (request, response) => {
  const target = String(request.body?.target ?? "").trim();
  if (!target) {
    response.status(400).json({ error: "No open target provided" });
    return;
  }

  try {
    if (/^https?:\/\//i.test(target) || target.toLowerCase() === "youtube") {
      const url = target.toLowerCase() === "youtube" ? "https://www.youtube.com" : target;
      const child = spawn("cmd.exe", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore"
      });
      child.unref();
      response.json({ ok: true, message: `Opened URL: ${url}` });
    } else {
      const lower = target.toLowerCase();
      let executable = target;
      if (lower === "file manager" || lower === "file explorer" || lower === "explorer") {
        executable = "explorer.exe";
      } else if (lower === "task manager" || lower === "taskmgr") {
        executable = "taskmgr.exe";
      } else if (lower === "command prompt" || lower === "cmd") {
        executable = "cmd.exe";
      } else if (lower === "calculator" || lower === "calc") {
        executable = "calc.exe";
      } else if (lower === "notepad") {
        executable = "notepad.exe";
      }
      const child = spawn("cmd.exe", ["/c", "start", "", executable], {
        detached: true,
        stdio: "ignore"
      });
      child.unref();
      response.json({ ok: true, message: `Opened application: ${executable}` });
    }
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to open target" });
  }
});

systemRouter.post("/execute", async (request, response) => {
  const command = String(request.body?.command ?? "").trim();
  if (!command) {
    response.status(400).json({ error: "No command provided" });
    return;
  }

  const lower = command.toLowerCase();
  if (
    lower.includes("format") ||
    lower.includes("rmdir /s") ||
    lower.includes("del /f") ||
    lower.includes("rd /s")
  ) {
    response.status(403).json({ error: "Command blocked for safety reasons." });
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(command);
    response.json({ ok: true, stdout, stderr });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Command execution failed" });
  }
});

systemRouter.post("/control", async (request, response) => {
  const action = String(request.body?.action ?? "").trim().toLowerCase();
  try {
    if (action === "lock") {
      await execAsync("rundll32.exe user32.dll,LockWorkStation");
      response.json({ ok: true, message: "Workstation locked." });
    } else if (action === "volume") {
      const level = Math.max(0, Math.min(100, Number(request.body?.level ?? 50)));
      const presses = Math.round(level / 2);
      const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$w = new-object -com wscript.shell; for ($i=0; $i -lt 50; $i++) { $w.sendkeys([char]174) }; for ($i=0; $i -lt ${presses}; $i++) { $w.sendkeys([char]175) }"`;
      await execAsync(psCommand);
      response.json({ ok: true, message: `Volume set to ${level}%` });
    } else {
      response.status(400).json({ error: `Unsupported action: ${action}` });
    }
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Failed to control system" });
  }
});
