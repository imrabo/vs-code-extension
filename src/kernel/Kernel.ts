import { IKernel, IConfig } from './interfaces';
import { ConfigManager } from './ConfigManager';
import { Logger } from './Logger';
import { EventBus } from './EventBus';
import { ServiceRegistry } from './ServiceRegistry';
import { DependencyInjector } from './DependencyInjector';

export class Kernel implements IKernel {
    private configManager: ConfigManager;
    private logger: Logger;
    private eventBus: EventBus;
    private serviceRegistry: ServiceRegistry;
    private injector: DependencyInjector;

    constructor() {
        // Initialize core components that don't depend on other services yet.
        this.configManager = new ConfigManager();

        // Placeholder initialization for now, to be finalized during full DI phase.
        this.logger = new Logger('info', './imrabo.log');
        this.eventBus = new EventBus();
        this.serviceRegistry = new ServiceRegistry();
        this.injector = new DependencyInjector(this.serviceRegistry);
    }

    public async initialize(config: IConfig): Promise<void> {
        this.logger.info("Kernel initialization started.");

        try {
            // 1. Configuration Load (must happen first)
            const loadedConfig = this.configManager.loadConfig();
            if (!loadedConfig) {
                throw new Error("Failed to load valid configuration.");
            }

            // 2. Initialize Core Services (Using injected dependencies from Kernel itself)
            this.logger = new Logger(loadedConfig.logLevel, loadedConfig.logFilePath || './imrabo.log');
            this.eventBus = new EventBus(); // Re-instantiate if needed for full context
            this.serviceRegistry = new ServiceRegistry();

            // 3. Register Core Services
            this.serviceRegistry.registerService('config_manager', this.configManager);
            this.serviceRegistry.registerService('logger', this.logger);
            this.serviceRegistry.registerService('event_bus', this.eventBus);
            this.serviceRegistry.registerService('dependency_injector', this.injector);

            // 4. Perform final setup/validation
            this.logger.info("Core services registered successfully.");

            // 5. Ready State
            console.log("--- Kernel Initialized Successfully ---");

        } catch (error) {
            const err = error instanceof Error ? error.message : String(error);
            console.error(`[FATAL KERNEL ERROR] Initialization failed: ${err}`);
            // Critical failure: halt execution
            process.exit(1);
        }
    }

    public getService(serviceName: string): any | undefined {
        return this.serviceRegistry.getService(serviceName);
    }

    public publish(eventName: string, data: any): void {
        this.eventBus.publish(eventName, data);
    }

    public subscribe(eventName: string, handler: (data: any) => void): void {
        this.eventBus.subscribe(eventName, handler);
    }

    public async shutdown(): Promise<void> {
        this.logger.info("Kernel shutting down gracefully.");
        // In a real system, this is where you would close file handles, stop listeners, etc.
        console.log("--- Kernel Shutdown Complete ---");
    }
}