export interface CaffeinateConfig {
  enabled?: boolean;
  flags?: string;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFunction = (
  message: string,
  level?: LogLevel
) => Promise<void>;
