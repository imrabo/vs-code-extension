import { IAgentDefinition } from './interfaces';
import { ServiceRegistry } from '../kernel/ServiceRegistry';

/**
 * Manages the loading, registration, and retrieval of all agent definitions.
 */
export class AgentManager {
    private registry: Map<string, IAgentDefinition> = new Map();
    private serviceRegistry: ServiceRegistry; // Dependency injection via Kernel's context (mocked here)

    constructor(serviceRegistry: ServiceRegistry) {
        this.serviceRegistry = serviceRegistry;
    }

    /**
     * Manually registers an agent definition into the system.
     */
    registerAgent(definition: IAgentDefinition): void {
        if (this.registry.has(definition.id)) {
            throw new Error(`Agent with ID ${definition.id} is already registered.`);
        }
        this.registry.set(definition.id, definition);

        // Register agent metadata in the kernel context for runtime access later
        this.serviceRegistry.registerService(`agent:${definition.id}`, definition);
        console.log(`[AgentManager] Registered Agent: ${definition.name} (${definition.id})`);
    }

    /**
     * Retrieves a registered agent definition.
     */
    getAgent(agentId: string): IAgentDefinition | undefined {
        return this.registry.get(agentId);
    }

    /**
     * Mocks the loading of agents from a directory path (e.g., scanning for .yaml files).
     * In a real system, this would use fs operations and YAML parsers.
     */
    async loadAgents(directoryPath: string): Promise<void> {
        console.log(`[AgentManager] Starting scan of directory: ${directoryPath}`);

        // MOCK: Simulate finding and parsing the required initial agents (Planner, Coder, Reviewer)
        const mockAgents: IAgentDefinition[] = [
            {
                id: 'planner_001',
                name: 'PlannerAgent',
                manifest: {
                    tools: ['read_file'], // Links to Step 7 tools
                    inputs: { targetFile: 'plan.txt' },
                    outputs: { result: "Plan generated" },
                    timeoutMs: 60000,
                },
            },
            {
                id: 'coder_002',
                name: 'CoderAgent',
                manifest: {
                    tools: ['write_file'], // Links to Step 7 tools
                    inputs: { file: 'plan.txt' },
                    outputs: { result: "Code generated" },
                    timeoutMs: 30000,
                },
            },
            {
                id: 'reviewer_003',
                name: 'ReviewerAgent',
                manifest: {
                    tools: ['read_file'],
                    inputs: { file: 'plan.txt' },
                    outputs: { result: "Review completed" },
                    timeoutMs: 15000,
                },
            },
        ];

        for (const agent of mockAgents) {
            this.registerAgent(agent);
        }

        console.log(`[AgentManager] Loaded ${mockAgents.length} initial agents.`);
    }
}