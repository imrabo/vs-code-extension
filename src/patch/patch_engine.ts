import { IPatch, IPatchResult } from './interfaces';
import { IToolRuntime } from '../tools/interfaces'; // Dependency on Tool Runtime
import { Logger } from '../kernel/Logger'; // Dependency on Kernel Logger

/**
 * The core engine for safely modifying files based on agent instructions.
 */
export class PatchEngine implements IPatchEngine {
    private toolRuntime: IToolRuntime;
    private logger: Logger;

    constructor(toolRuntime: IToolRuntime, logger: Logger) {
        this.toolRuntime = toolRuntime;
        this.logger = logger;
    }

    /**
     * Validates the proposed patch against system rules before execution.
     */
    validatePatch(patch: IPatch): boolean {
        // In a real implementation, this would check permissions, sandbox context, and potential conflicts.
        if (!patch.reasoning || patch.confidenceScore < 0.5) {
            this.logger.warn(`Patch validation failed for ${patch.filepath}: Insufficient reasoning or low confidence.`);
            return false;
        }
        // Placeholder for deeper semantic checks (to be enhanced in Step 9)
        return true;
    }

    /**
     * Applies a patch using the ToolRuntime to perform filesystem operations safely.
     */
    async applyPatch(patch: IPatch): Promise<IPatchResult> {
        if (!this.validatePatch(patch)) {
            return { success: false, error: "Patch validation failed." };
        }

        try {
            // Delegation to the ToolRuntime ensures filesystem access is mediated and checked.
            const result = await this.toolRuntime.execute(
                'file_edit', // Assuming 'file_edit' is a tool name defined in Step 7
                {
                    filepath: patch.filepath,
                    operation: patch.operation,
                    content: patch.content,
                    reasoning: patch.reasoning,
                    confidence: patch.confidenceScore,
                }
            );

            if (!result.success) {
                throw new Error(`Tool execution failed during file operation: ${result.error}`);
            }

            this.logger.info(`Successfully applied patch to ${patch.filepath}`, {
                toolUsed: 'file_edit',
                confidence: patch.confidenceScore,
                reason: patch.reasoning
            });

            return { success: true, appliedPath: patch.filepath, reason: patch.reasoning, details: result };

        } catch (error) {
            this.logger.error(`Failed to apply file patch for ${patch.filepath}`, { error: String(error), patch: patch });
            return {
                success: false,
                error: `Patch application failed: ${String(error)}`
            };
        }
    }
}