import { IServiceRegistry } from './interfaces';

export class ServiceRegistry implements IServiceRegistry {
    private services: Map<string, any> = new Map();

    registerService(name: string, service: any): void {
        if (this.services.has(name)) {
            throw new Error(`Service already registered: ${name}`);
        }
        this.services.set(name, service);
    }

    getService(serviceName: string): any | undefined {
        return this.services.get(serviceName);
    }
}