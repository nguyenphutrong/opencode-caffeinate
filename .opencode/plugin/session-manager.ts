import { existsSync, mkdirSync, writeFileSync, unlinkSync, readdirSync } from "fs";
import { join } from "path";

export class SessionManager {
  private sessionsDir: string;

  constructor(sessionsDir: string = "/tmp/opencode-caffeinate/sessions") {
    this.sessionsDir = sessionsDir;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!existsSync(this.sessionsDir)) {
      mkdirSync(this.sessionsDir, { recursive: true });
    }
  }

  registerSession(pid: number): void {
    const sessionFile = join(this.sessionsDir, `${pid}.session`);
    writeFileSync(sessionFile, "", { flag: "w" });
  }

  unregisterSession(pid: number): void {
    const sessionFile = join(this.sessionsDir, `${pid}.session`);
    if (existsSync(sessionFile)) {
      unlinkSync(sessionFile);
    }
  }

  getActiveSessions(): number[] {
    if (!existsSync(this.sessionsDir)) {
      return [];
    }

    const files = readdirSync(this.sessionsDir);
    const activeSessions: number[] = [];

    for (const file of files) {
      if (file.endsWith(".session")) {
        const pid = parseInt(file.replace(".session", ""), 10);
        if (!isNaN(pid) && this.isProcessAlive(pid)) {
          activeSessions.push(pid);
        }
      }
    }

    return activeSessions;
  }

  hasActiveSessions(): boolean {
    return this.getActiveSessions().length > 0;
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
