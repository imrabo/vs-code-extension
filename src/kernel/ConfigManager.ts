import { IConfig } from './interfaces';

export class ConfigManager {
    private config: IConfig;

    constructor() {
        // Initialize with safe defaults if no file is loaded
        this.config = {
            logLevel: 'info',
            defaultTimeoutMs: 5000,
            logFilePath: undefined,
        };
    }

    /**
     * Loads configuration from environment variables (mocked for this implementation).
     */
    loadConfig(): IConfig {
        // In a real application, this would read .env or config files.
        const envLogLevel = process.env.IMRABO_LOG_LEVEL || 'info';

        if (['debug', 'info', 'warn', 'error'].includes(envLogLevel.toLowerCase())) {
            this.config.logLevel = envLogLevel.toLowerCase() as 'debug' | 'info' | 'warn' | 'error';
        } else {
            this.config.logLevel = 'info';
        }

        // Mock reading other settings
        this.config.defaultTimeoutMs = parseInt(process.env.IMRABO_TIMEOUT_MS || '5000', 10);

        if (!this.config.logFilePath) {
            this.config.logFilePath = './imrabo.log'; // Default file path
        }

        console.log(`[Kernel] Configuration loaded. Log Level: ${this.config.logLevel}`);
        return this.config;
    }

    public getConfig(): IConfig {
        return this.config;
    }
}