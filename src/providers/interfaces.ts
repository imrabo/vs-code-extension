/**
 * @imrabo/providers - Model Provider Interfaces
 *
 * Defines the unified interface for interacting with any Large Language Model
 * provider within the AgentOS ecosystem.
 */

export type ModelResponse = {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
};

export interface IModelProvider {
    /**
     * Generates a response based on the input prompt.
     * @param prompt The user's request or instruction.
     * @param context Optional additional context provided by the agent system.
     * @returns A promise that resolves to the model's generated text and usage statistics.
     */
    generate(prompt: string, context?: object): Promise<ModelResponse>;

    /**
     * Checks the health and capability of the underlying model provider.
     * @returns A promise that resolves to true if the provider is healthy.
     */
    checkHealth(): Promise<boolean>;

    /**
     * Identifies the name/type of the provider.
     * @returns The unique identifier for this provider (e.g., 'lmstudio', 'ollama').
     */
    getProviderName(): string;
}