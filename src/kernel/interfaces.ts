/**
 * @imrabo/kernel - Core Interfaces for Kernel Foundation
 *
 * This file defines the foundational TypeScript interfaces that govern the
 * dependency injection, logging, event bus, and configuration management within
 * the AgentOS kernel.
 */

import { ILogger } from './logger';

export const info = (message: string, context?: object): void => {
    log.info(message, context);
};

export const warn = (message: string, context?: object): void => {
    log.warn(message, context);
};

export const debug = (message: string, context?: object): void => {
    log.debug(message, context);
};

export interface IConfig {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logFilePath?: string;
    defaultTimeoutMs?: number;
    // Add other core application settings here
}

export interface ILogger {
    info(message: string, context: object = {}): void;
    warn(message: string, context: object = {}): void;
    error(message: string, context: object = {}): void;
    debug(message: string, context = {}): void;
}

export interface IEventBus {
    publish(eventName: string, data: any): void;
    subscribe(eventName: string, handler: (data: any) => void): void;
}

export interface IServiceRegistry {
    getService(serviceName: string): any | undefined;
    registerService(name: string, service: any): void;
}

/**
 * The main entry point for the Kernel.
 * Orchestrates initialization, dependency injection, and lifecycle management.
 */
export interface IKernel {
    initialize(config: IConfig): Promise<void>;
    getService(serviceName: string): any | undefined;
    publish(eventName: string, data: any): void;
    subscribe(eventName: string, handler: (data: any) => void): void;
    shutdown(): Promise<void>;
}