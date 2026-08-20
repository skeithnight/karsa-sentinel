export type LogLevel = "debug" | "info" | "warn" | "error";

export class SentinelLogger {
  private static instance: SentinelLogger;
  private isDebugEnabled: boolean = false;

  private constructor() {
    this.isDebugEnabled =
      process.env.DEBUG === "true" ||
      process.env.SENTINEL_DEBUG === "true" ||
      process.argv.includes("-d") ||
      process.argv.includes("--debug");
  }

  static getInstance(): SentinelLogger {
    if (!SentinelLogger.instance) {
      SentinelLogger.instance = new SentinelLogger();
    }
    return SentinelLogger.instance;
  }

  setDebug(enabled: boolean): void {
    this.isDebugEnabled = enabled;
  }

  isDebug(): boolean {
    return this.isDebugEnabled;
  }

  debug(category: string, message: string, data?: unknown): void {
    if (!this.isDebugEnabled) return;
    const timestamp = new Date().toISOString().split("T")[1]?.slice(0, 8);
    console.log(`\x1b[90m[${timestamp}]\x1b[0m \x1b[35m[DEBUG:${category}]\x1b[0m ${message}`);
    if (data !== undefined) {
      if (typeof data === "string") {
        console.log(`\x1b[90m${data}\x1b[0m`);
      } else {
        console.log(`\x1b[90m${JSON.stringify(data, null, 2)}\x1b[0m`);
      }
    }
  }

  info(message: string): void {
    console.log(message);
  }

  step(icon: string, message: string): void {
    console.log(`${icon} ${message}`);
  }

  warn(message: string): void {
    console.warn(`\x1b[33m⚠️  ${message}\x1b[0m`);
  }

  error(message: string, error?: unknown): void {
    console.error(`\x1b[31m❌ ${message}\x1b[0m`);
    if (error && this.isDebugEnabled) {
      console.error(error);
    }
  }
}

export const logger = SentinelLogger.getInstance();
