import { IToolRuntime, IToolResult } from './interfaces';
import { ToolRegistry } from './tool_registry';

/**
 * The core runtime for executing tools safely within the Agent context.
 */
export class ToolRuntime implements IToolRuntime {
    private toolRegistry: ToolRegistry;

    constructor(toolRegistry: ToolRegistry) {
        this.toolRegistry = toolRegistry;
        console.log("[ToolRuntime] Initialized, ready to execute tools.");
    }

    /**
     * Executes a requested tool call safely.
     * This layer is critical for preventing filesystem access by agents.
     */
    async execute(toolName: string, parameters: object): Promise<IToolResult> {
        const tool = this.toolRegistry.getTool(toolName);

        if (!tool) {
            return {
                success: false,
                error: `Tool not found: ${toolName}`
            };
        }

        // --- SECURITY CHECK (The core principle of the runtime) ---
        // In a production system, this is where sandboxing/ACL checks occur.
        if (toolName.startsWith('file_')) {
            // Critical check: Prevent arbitrary file operations unless explicitly permitted.
            // Actual file logic must be delegated to a separate, highly secured service layer (Step 14).
            console.warn(`[ToolRuntime] Blocked potential filesystem access attempt for tool: ${toolName}`);
            return { success: false, error: "Filesystem operations are restricted by policy." };
        }

        // --- MOCK EXECUTION (Simulating the actual work) ---
        console.log(`[ToolRuntime] Executing tool: ${toolName} with parameters:`, parameters);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate latency

        // Mock result generation based on tool type
        let mockOutput: any;
        if (toolName === 'read_file') {
            mockOutput = { content: `Mock content read from file specified by parameters.` };
        } else if (toolName === 'write_file') {
            mockOutput = { status: 'success', path: parameters.path, dataWritten: parameters.data ? parameters.data.length : 0 };
        } else {
            mockOutput = { message: `Tool ${toolName} executed successfully.` };
        }

        return { success: true, output: mockOutput };
    }
}