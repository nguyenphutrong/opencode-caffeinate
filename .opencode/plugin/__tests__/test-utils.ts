import { describe, test, expect, mock } from "bun:test";

/**
 * Mock utilities for testing file operations
 */
export const createMockFileSystem = () => {
  const files = new Map<string, string>();
  
  return {
    files,
    mockWrite: (path: string, content: string) => {
      files.set(path, content);
    },
    mockRead: (path: string): string | undefined => {
      return files.get(path);
    },
    mockExists: (path: string): boolean => {
      return files.has(path);
    },
    mockDelete: (path: string): boolean => {
      return files.delete(path);
    },
    mockList: (dirPath: string): string[] => {
      return Array.from(files.keys()).filter(path => path.startsWith(dirPath));
    },
    reset: () => {
      files.clear();
    }
  };
};

/**
 * Mock utilities for testing process operations
 */
export const createMockProcessManager = () => {
  const processes = new Map<number, { command: string[], alive: boolean }>();
  let nextPid = 1000;
  
  return {
    processes,
    mockSpawn: (command: string[]): { pid: number } => {
      const pid = nextPid++;
      processes.set(pid, { command, alive: true });
      return { pid };
    },
    mockKill: (pid: number): void => {
      const process = processes.get(pid);
      if (process) {
        process.alive = false;
      }
    },
    mockIsAlive: (pid: number): boolean => {
      const process = processes.get(pid);
      return process?.alive ?? false;
    },
    reset: () => {
      processes.clear();
      nextPid = 1000;
    }
  };
};
