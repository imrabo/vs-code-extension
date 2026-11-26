import { IEventBus } from './interfaces';

export class EventBus implements IEventBus {
    private subscriptions: Map<string, Array<(data: any) => void>> = new Map();

    /**
     * Registers a handler for a specific event.
     */
    subscribe(eventName: string, handler: (data: any) => void): void {
        if (!this.subscriptions.has(eventName)) {
            this.subscriptions.set(eventName, []);
        }
        this.subscriptions.get(eventName)!.push(handler);
    }

    /**
     * Publishes an event to all subscribed handlers.
     */
    publish(eventName: string, data: any): void {
        const handlers = this.subscriptions.get(eventName);
        if (handlers) {
            // Dispatch events synchronously within the kernel thread for simplicity initially.
            handlers.forEach(handler => handler(data));
        } else {
            // Log if no one is listening, useful for debugging component isolation.
            // In a real setup, this would use the Logger service injected into the bus context.
            console.warn(`[EventBus] No subscribers found for event: ${eventName}`);
        }
    }
}