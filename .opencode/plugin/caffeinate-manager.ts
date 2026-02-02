import { existsSync, readFileSync, writeFileSync, unlinkSync } from "fs";

export class CaffeinateManager {
  private pidFile: string;
  private process: any = null;

  constructor(pidFile: string = "/tmp/opencode-caffeinate/caffeinate.pid") {
    this.pidFile = pidFile;
  }

  async start(): Promise<void> {
    if (this.isRunning()) {
      return;
    }

    try {
      this.process = Bun.spawn(["caffeinate", "-dim"], {
        stdout: "ignore",
        stderr: "ignore",
      });

      writeFileSync(this.pidFile, String(this.process.pid), { flag: "w" });
    } catch (error) {
      throw new Error(`Failed to start caffeinate: ${error}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning()) {
      return;
    }

    const pid = this.getPid();
    if (pid) {
      try {
        process.kill(pid, "SIGTERM");
      } catch (error: any) {
        if (error.code !== "ESRCH") {
          throw error;
        }
      }
    }

    if (this.process) {
      try {
        this.process.kill();
      } catch {}
      this.process = null;
    }

    if (existsSync(this.pidFile)) {
      unlinkSync(this.pidFile);
    }
  }

  isRunning(): boolean {
    const pid = this.getPid();
    if (!pid) {
      return false;
    }

    return this.isProcessAlive(pid);
  }

  getPid(): number | null {
    if (this.process && this.process.pid) {
      return this.process.pid;
    }

    if (!existsSync(this.pidFile)) {
      return null;
    }

    try {
      const pidStr = readFileSync(this.pidFile, "utf-8").trim();
      const pid = parseInt(pidStr, 10);
      if (isNaN(pid)) {
        return null;
      }
      return pid;
    } catch {
      return null;
    }
  }

  private isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error: any) {
      if (error.code === "ESRCH") {
        return false;
      }
      if (error.code === "EPERM") {
        return true;
      }
      return false;
    }
  }
}
