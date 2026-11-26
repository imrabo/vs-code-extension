import { IAgentDefinition, IExecutionResult } from '../runtime/interfaces';
import { Executor } from '../runtime/Executor';
import { ServiceRegistry } from '../kernel/ServiceRegistry';

interface WorkflowStep {
    agentId: string;
    name: string;
    inputs?: Record<string, any>;
}

interface WorkflowManifest {
    workflowId: string;
    steps: WorkflowStep[];
}

/**
 * Executes declarative workflows sequentially.
 */
export class WorkflowExecutor {
    private readonly executor: Executor;
    private readonly serviceRegistry: ServiceRegistry;

    constructor(
        executor: Executor,
        serviceRegistry: ServiceRegistry
    ) {
        this.executor = executor;
        this.serviceRegistry = serviceRegistry;
    }

    /**
     * Execute a workflow manifest.
     */
    async runWorkflow(
        workflowId: string,
        initialInputs: Record<string, any>,
        manifestPath: string
    ): Promise<IExecutionResult> {

        console.log(
            `[WorkflowExecutor] Starting workflow '${workflowId}' using '${manifestPath}'`
        );

        const manifest = this.mockLoadWorkflow(manifestPath);

        if (!manifest.steps.length) {
            throw new Error("Workflow contains no steps.");
        }

        const history: IExecutionResult[] = [];

        // Shared state between workflow steps
        let workflowContext: Record<string, any> = {
            ...initialInputs
        };

        try {

            for (const step of manifest.steps) {

                console.log(
                    `[WorkflowExecutor] Running step '${step.name}' (${step.agentId})`
                );

                //--------------------------------------------------
                // Resolve Agent
                //--------------------------------------------------

                const agentDefinition = this.serviceRegistry.getService(
                    `agent:${step.agentId}`
                ) as IAgentDefinition | undefined;

                if (!agentDefinition) {
                    throw new Error(
                        `Agent '${step.agentId}' not found.`
                    );
                }

                //--------------------------------------------------
                // Resolve Context Manager (optional)
                //--------------------------------------------------

                const contextManager = this.serviceRegistry.getService(
                    "context_manager"
                ) as any;

                if (contextManager?.createContext) {
                    const executionContext =
                        contextManager.createContext(
                            step.agentId,
                            agentDefinition
                        );

                    Object.assign(
                        executionContext.contextVariables,
                        workflowContext
                    );
                }

                //--------------------------------------------------
                // Execute Agent
                //--------------------------------------------------

                const result = await this.executor.execute(
                    step.agentId,
                    {
                        ...workflowContext,
                        ...(step.inputs ?? {})
                    }
                );

                history.push(result);

                if (!result.success) {
                    throw new Error(
                        result.error ??
                        `Step '${step.name}' failed.`
                    );
                }

                //--------------------------------------------------
                // Merge outputs into workflow state
                //--------------------------------------------------

                if (
                    result.output &&
                    typeof result.output === "object"
                ) {
                    workflowContext = {
                        ...workflowContext,
                        ...result.output
                    };
                }
            }

            console.log(
                `[WorkflowExecutor] Workflow '${workflowId}' completed successfully.`
            );

            return {
                success: true,
                output: workflowContext,

            };

        } catch (err) {

            const message =
                err instanceof Error
                    ? err.message
                    : String(err);

            console.error(
                `[WorkflowExecutor] Workflow '${workflowId}' failed.`,
                err
            );

            history.push({
                success: false,
                error: message
            });

            return {
                success: false,
                error: message,

            };
        }
    }

    /**
     * Mock manifest loader.
     * Replace with YAML/JSON parsing.
     */
    private mockLoadWorkflow(
        _manifestPath: string
    ): WorkflowManifest {

        return {
            workflowId: "example_planning_workflow",

            steps: [
                {
                    name: "PlanningPhase",
                    agentId: "planner_001",
                    inputs: {
                        targetFile: "plan.txt"
                    }
                },
                {
                    name: "CodingPhase",
                    agentId: "coder_002",
                    inputs: {
                        file: "plan.txt"
                    }
                },
                {
                    name: "ReviewPhase",
                    agentId: "reviewer_003",
                    inputs: {
                        file: "plan.txt"
                    }
                }
            ]
        };
    }
}