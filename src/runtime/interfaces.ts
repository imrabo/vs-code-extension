/**
 * @imrabo/runtime - Runtime Interfaces
 *
 * Defines the core contracts for loading, executing, and managing agents.
 */

export interface IExecutionResult {
    success: boolean;
    output?: any; // Structured result from the agent execution
    error?: string; // Error message if execution failed
    trace?: string[]; // Trace/history of steps taken
}

export interface IAgentDefinition {
    id: string;
    name: string;
    manifest: object; // The raw configuration loaded from YAML/JSON
    tools: string[]; // List of tools this agent is authorized to use
    inputs: object;   // Initial inputs provided to the agent
    outputs: object;  // Expected output structure definition
    timeoutMs?: number; // Execution timeout rule
}

export interface IExecutionContext {
    agentId: string;
    initialInputs: object;
    contextVariables: Record<string, any>; // State variables during execution
    toolMap: Record<string, function> | undefined; // Mapped tools available to the agent
    history: IExecutionResult[]; // Execution history
}

/**
 * Interface for loading and parsing agent definitions.
 */
export interface IAgentLoader {
    loadAgent(manifestPath: string): Promise<IAgentDefinition>;
}

/**
 * Interface for executing a loaded agent.
 */
export interface IAgentExecutor {
    execute(agentId: string, inputs: object): Promise<IExecutionResult>;
}

/**
 * Interface for managing the runtime context during execution.
 */
export interface IContextManager {
    createContext(agentId: string, definition: IAgentDefinition): IExecutionContext;
    updateContext(context: IExecutionContext, stepName: string, data: any): void;
    getHistory(agentId: string): IExecutionResult[];
}