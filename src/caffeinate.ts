import type { Subprocess } from "bun";

/**
 * CaffeinateManager - Manages macOS caffeinate subprocess lifecycle
 *
 * Prevents system sleep while OpenCode sessions are active.
 * Uses macOS `caffeinate` command with flags:
 *   -d: Prevent display sleep
 *   -i: Prevent idle sleep
 *   -m: Prevent disk sleep
 */
export class CaffeinateManager {
  private process: Subprocess | null = null;
  private activeSessionCount = 0;
  private readonly logFn: ((message: string, level?: "debug" | "info" | "warn" | "error") => Promise<void>) | null;

  constructor(
    logFn?: (message: string, level?: "debug" | "info" | "warn" | "error") => Promise<void>
  ) {
    this.logFn = logFn ?? null;
  }

  private async log(message: string, level: "debug" | "info" | "warn" | "error" = "info"): Promise<void> {
    if (this.logFn) {
      await this.logFn(message, level);
    }
  }

  /**
   * Check if running on macOS
   */
  static isMacOS(): boolean {
    return process.platform === "darwin";
  }

  /**
   * Start caffeinate process if not already running
   */
  async start(): Promise<boolean> {
    if (!CaffeinateManager.isMacOS()) {
      await this.log("caffeinate is only available on macOS", "warn");
      return false;
    }

    this.activeSessionCount++;
    await this.log(`Session started. Active sessions: ${this.activeSessionCount}`, "debug");

    if (this.process) {
      await this.log("caffeinate already running", "debug");
      return true;
    }

    try {
      this.process = Bun.spawn(["caffeinate", "-dim"], {
        stdout: "ignore",
        stderr: "ignore",
      });

      await this.log(`caffeinate started (PID: ${this.process.pid})`, "info");
      return true;
    } catch (error) {
      await this.log(`Failed to start caffeinate: ${error}`, "error");
      return false;
    }
  }

  /**
   * Stop caffeinate process when all sessions end
   */
  async stop(): Promise<boolean> {
    this.activeSessionCount = Math.max(0, this.activeSessionCount - 1);
    await this.log(`Session ended. Active sessions: ${this.activeSessionCount}`, "debug");

    if (this.activeSessionCount > 0) {
      await this.log("Other sessions still active, keeping caffeinate running", "debug");
      return true;
    }

    return this.forceStop();
  }

  /**
   * Force stop caffeinate regardless of session count
   */
  async forceStop(): Promise<boolean> {
    if (!this.process) {
      return true;
    }

    try {
      const pid = this.process.pid;
      this.process.kill();
      this.process = null;
      this.activeSessionCount = 0;
      await this.log(`caffeinate stopped (PID: ${pid})`, "info");
      return true;
    } catch (error) {
      await this.log(`Failed to stop caffeinate: ${error}`, "error");
      return false;
    }
  }

  /**
   * Check if caffeinate process is running
   */
  isRunning(): boolean {
    return this.process !== null;
  }

  /**
   * Get current active session count
   */
  getActiveSessionCount(): number {
    return this.activeSessionCount;
  }

  /**
   * Get caffeinate process PID (if running)
   */
  getPid(): number | null {
    return this.process?.pid ?? null;
  }
}
