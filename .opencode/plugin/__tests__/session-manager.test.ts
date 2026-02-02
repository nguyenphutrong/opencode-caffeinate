import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { SessionManager } from "../session-manager";
import { mkdirSync, rmSync, existsSync, readdirSync } from "fs";
import { join } from "path";

const TEST_DIR = "/tmp/opencode-caffeinate-test-sessions";

describe("SessionManager", () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
    mkdirSync(TEST_DIR, { recursive: true });
    sessionManager = new SessionManager(TEST_DIR);
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test("registerSession creates session file", () => {
    const pid = process.pid;
    sessionManager.registerSession(pid);
    
    const sessionFile = join(TEST_DIR, `${pid}.session`);
    expect(existsSync(sessionFile)).toBe(true);
  });

  test("unregisterSession removes session file", () => {
    const pid = process.pid;
    sessionManager.registerSession(pid);
    sessionManager.unregisterSession(pid);
    
    const sessionFile = join(TEST_DIR, `${pid}.session`);
    expect(existsSync(sessionFile)).toBe(false);
  });

  test("getActiveSessions returns only valid PIDs", () => {
    const validPid = process.pid;
    const stalePid = 999999;
    
    sessionManager.registerSession(validPid);
    sessionManager.registerSession(stalePid);
    
    const activeSessions = sessionManager.getActiveSessions();
    
    expect(activeSessions).toContain(validPid);
    expect(activeSessions).not.toContain(stalePid);
  });

  test("hasActiveSessions returns false when empty", () => {
    expect(sessionManager.hasActiveSessions()).toBe(false);
  });

  test("hasActiveSessions returns true when valid sessions exist", () => {
    sessionManager.registerSession(process.pid);
    expect(sessionManager.hasActiveSessions()).toBe(true);
  });

  test("handles stale PID files gracefully", () => {
    const stalePid = 999999;
    sessionManager.registerSession(stalePid);
    
    expect(sessionManager.hasActiveSessions()).toBe(false);
    
    const sessionFile = join(TEST_DIR, `${stalePid}.session`);
    expect(existsSync(sessionFile)).toBe(true);
  });

  test("getActiveSessions filters out stale sessions", () => {
    const validPid = process.pid;
    const stalePid1 = 999998;
    const stalePid2 = 999999;
    
    sessionManager.registerSession(validPid);
    sessionManager.registerSession(stalePid1);
    sessionManager.registerSession(stalePid2);
    
    const activeSessions = sessionManager.getActiveSessions();
    
    expect(activeSessions.length).toBe(1);
    expect(activeSessions[0]).toBe(validPid);
  });
});
