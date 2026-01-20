import type { Plugin } from "@opencode-ai/plugin";
import { CaffeinateManager } from "./src/caffeinate";

const SERVICE_NAME = "opencode-caffeinate";

export const CaffeinatePlugin: Plugin = async ({ client }) => {
  const logFn = async (message: string, level: "debug" | "info" | "warn" | "error" = "info") => {
    await client.app.log({
      body: {
        service: SERVICE_NAME,
        level,
        message,
      },
    });
  };

  const manager = new CaffeinateManager(logFn);

  if (!CaffeinateManager.isMacOS()) {
    await logFn("Plugin disabled: caffeinate is only available on macOS", "warn");
    return {};
  }

  await logFn("Plugin initialized", "info");

  return {
    event: async ({ event }) => {
      switch (event.type) {
        case "session.created":
          await manager.start();
          break;

        case "session.idle":
        case "session.deleted":
          await manager.stop();
          break;
      }
    },
  };
};

export default CaffeinatePlugin;
export { CaffeinateManager } from "./src/caffeinate";
export type { CaffeinateConfig, LogFunction, LogLevel } from "./src/types";
