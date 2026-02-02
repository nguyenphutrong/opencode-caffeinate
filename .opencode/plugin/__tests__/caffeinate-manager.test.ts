import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { CaffeinateManager } from "../caffeinate-manager";
import { existsSync, rmSync, writeFileSync } from "fs";

const TEST_PID_FILE = "/tmp/opencode-caffeinate-test.pid";

describe("CaffeinateManager", () => {
  let caffeinateManager: CaffeinateManager;

  beforeEach(() => {
    if (existsSync(TEST_PID_FILE)) {
      rmSync(TEST_PID_FILE, { force: true });
    }
    caffeinateManager = new CaffeinateManager(TEST_PID_FILE);
  });

  afterEach(async () => {
    await caffeinateManager.stop();
    if (existsSync(TEST_PID_FILE)) {
      rmSync(TEST_PID_FILE, { force: true });
    }
  });

  test("start spawns caffeinate and creates PID file", async () => {
    await caffeinateManager.start();
    
    expect(existsSync(TEST_PID_FILE)).toBe(true);
    expect(caffeinateManager.isRunning()).toBe(true);
  });

  test("start does nothing if already running", async () => {
    await caffeinateManager.start();
    const firstPid = caffeinateManager.getPid();
    
    await caffeinateManager.start();
    const secondPid = caffeinateManager.getPid();
    
    expect(firstPid).toBe(secondPid);
  });

  test("stop kills process and removes PID file", async () => {
    await caffeinateManager.start();
    expect(caffeinateManager.isRunning()).toBe(true);
    
    await caffeinateManager.stop();
    
    expect(caffeinateManager.isRunning()).toBe(false);
    expect(existsSync(TEST_PID_FILE)).toBe(false);
  });

  test("isRunning returns true when caffeinate is alive", async () => {
    await caffeinateManager.start();
    expect(caffeinateManager.isRunning()).toBe(true);
  });

  test("isRunning returns false when caffeinate is not running", () => {
    expect(caffeinateManager.isRunning()).toBe(false);
  });

  test("handles orphaned PID file (process died)", () => {
    writeFileSync(TEST_PID_FILE, "999999");
    
    expect(caffeinateManager.isRunning()).toBe(false);
  });

  test("handles corrupted PID file gracefully", () => {
    writeFileSync(TEST_PID_FILE, "not-a-number");
    
    expect(caffeinateManager.isRunning()).toBe(false);
  });
});
