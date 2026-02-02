import type { Plugin } from "@opencode-ai/plugin";
import { SessionManager } from "./session-manager";
import { CaffeinateManager } from "./caffeinate-manager";

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

  const sessionManager = new SessionManager();
  const caffeinateManager = new CaffeinateManager();

  // Fire-and-forget log to avoid blocking initialization
  logFn("Plugin initialized", "info");

  return {
    event: async ({ event }: { event: { type: string } }) => {
      switch (event.type) {
        case "session.created":
          sessionManager.registerSession(process.pid);
          
          if (caffeinateManager.isRunning()) {
            const pid = caffeinateManager.getPid();
            logFn(`Session started. caffeinate already running (PID: ${pid})`, "debug");
            return;
          }
          
          try {
            await caffeinateManager.start();
            const pid = caffeinateManager.getPid();
            logFn(`caffeinate started (PID: ${pid})`, "info");
          } catch (error) {
            logFn(`Failed to start caffeinate: ${error}`, "error");
          }
          break;

        case "session.idle":
        case "session.deleted":
          sessionManager.unregisterSession(process.pid);
          
          if (sessionManager.hasActiveSessions()) {
            const activeCount = sessionManager.getActiveSessions().length;
            logFn(`Session ended. ${activeCount} active sessions remaining`, "debug");
            return;
          }
          
          if (caffeinateManager.isRunning()) {
            try {
              const pid = caffeinateManager.getPid();
              await caffeinateManager.stop();
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
