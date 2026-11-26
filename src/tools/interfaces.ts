/**
 * @imrabo/tools - Tool Interfaces
 *
 * Defines the standardized interface for all executable tools within AgentOS.
 */

export interface ITool {
    name: string;
    description: string;
    parameters: object; // JSON Schema defining required inputs
}

export interface IToolResult {
    success?: boolean;
    error?: string;
    trace?: string[];
    output?: any; // result from tool execution
}

/**
 * Interface for the runtime mechanism that handles tool execution.
 */
export interface IToolRuntime {
    execute(toolName: string, parameters: object): Promise<IToolResult>;
}
 */
export interface IToolRuntime {
    execute(toolName: string, parameters: object): Promise<IToolResult>;
}