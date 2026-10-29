export type LogLevel = 'debug' | 'info' | 'step' | 'warn' | 'error';

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
    const badge = `[${level.toUpperCase()}]`.padEnd(7, ' ');
    return `${timestamp} ${badge} [${this.context}] ${message}`;
  }

  public debug(message: string, ...args: unknown[]): void {
    if (process.env.DEBUG || process.env.VERBOSE) {
      console.debug(this.format('debug', message), ...args);
    }
  }

  public info(message: string, ...args: unknown[]): void {
    console.info(this.format('info', message), ...args);
  }

  public step(stepName: string): void {
    console.info(this.format('step', `👉 ${stepName}`));
  }

  public warn(message: string, ...args: unknown[]): void {
    console.warn(this.format('warn', `⚠️ ${message}`), ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    console.error(this.format('error', `❌ ${message}`), ...args);
  }
}
