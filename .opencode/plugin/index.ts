import type { Plugin } from "@opencode-ai/plugin";

export const CaffeinatePlugin: Plugin = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  const SERVICE_NAME = "opencode-caffeinate";

  const logFn = (message: string, level: "info" | "warn" | "debug" | "error" = "info") => {
    client.app.log({
      body: {
        service: SERVICE_NAME,
        level,
        message,
      },
    }).catch(() => {});
  };

  // Check if on macOS
  if (process.platform !== "darwin") {
    logFn("Plugin disabled: only available on macOS", "warn");
    return {};
  }

  let activeSessionCount = 0;
  let caffeinateProcess: any = null;

  // Fire-and-forget log to avoid blocking initialization
  logFn("Plugin initialized", "info");

  return {
    event: async ({ event }: { event: { type: string } }) => {
      switch (event.type) {
        case "session.created":
          activeSessionCount++;
          if (caffeinateProcess) {
            logFn(`Session started. caffeinate already running (PID: ${caffeinateProcess.pid})`, "debug");
            return;
          }
          try {
            caffeinateProcess = Bun.spawn(["caffeinate", "-dim"], {
              stdout: "ignore",
              stderr: "ignore",
            });
            logFn(`caffeinate started (PID: ${caffeinateProcess.pid})`, "info");
          } catch (error) {
            logFn(`Failed to start caffeinate: ${error}`, "error");
          }
          break;

        case "session.idle":
        case "session.deleted":
          activeSessionCount = Math.max(0, activeSessionCount - 1);
          if (activeSessionCount > 0) {
            logFn(`Session ended. ${activeSessionCount} active sessions remaining`, "debug");
            return;
          }
          if (caffeinateProcess) {
            try {
              const pid = caffeinateProcess.pid;
              caffeinateProcess.kill();
              caffeinateProcess = null;
              logFn(`caffeinate stopped (PID: ${pid})`, "info");
            } catch (error) {
              logFn(`Failed to stop caffeinate: ${error}`, "error");
            }
          }
          break;
      }
    },
  };
};

export default CaffeinatePlugin;
