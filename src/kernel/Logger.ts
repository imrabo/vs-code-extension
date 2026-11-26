import { ILogger } from './interfaces';

export class Logger implements ILogger {
    private readonly configLevel: 'debug' | 'info' | 'warn' | 'error';
    private readonly logFilePath: string;

    constructor(configLevel: 'debug' | 'info' | 'warn' | 'error', logFilePath: string) {
        this.configLevel = configLevel;
        this.logFilePath = logFilePath;
        // In a real system, this would set up file stream or external logging service.
    }

    private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context: object): void {
        if (!this.isLevelEnabled(level)) {
            return;
        }

        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            context,
        };

        // Simulate structured logging to console/file
        console.log(`[${timestamp}] [${level}] ${message}`, context);
        // In a real implementation: fs.appendFileSync(this.logFilePath, JSON.stringify(logEntry) + '\n');
    }

    private isLevelEnabled(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
        const levels: { [key: string]: number } = { debug: 0, info: 1, warn: 2, error: 3 };
        return levels[level as keyof typeof levels] >= levels[this.configLevel];
    }

    info(message: string, context: object = {}): void {
        this.log('info', message, context);
    }

    warn(message: string, context: object = {}): void {
        this.log('warn', message, context);
    }

    error(message: string, context: object = {}): void {
        this.log('error', message, context);
    }

    debug(message: string, context: object = {}): void {
        this.log('debug', message, context);
    }
}