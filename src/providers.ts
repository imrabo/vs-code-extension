import { getConfiguration } from "./config";

export interface BenchmarkMetrics {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  tokensPerSecond: number;
}

export interface ModelResponse {
  content: string;
  model: string;
  provider: "local" | "remote";
  timestamp: number;
  metrics: BenchmarkMetrics;
  analysis: string;
}

export interface AIProvider {
  readonly providerType: "local" | "remote";
  call(prompt: string): Promise<ModelResponse>;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

function calculateTps(outputTokens: number, latencyMs: number): number {
  const seconds = Math.max(latencyMs / 1000, 0.001);
  return Number((outputTokens / seconds).toFixed(2));
}

export class LocalModelProvider implements AIProvider {
  readonly providerType = "local" as const;

  async call(prompt: string): Promise<ModelResponse> {
    const cfg = getConfiguration();
    const startedAt = Date.now();
    const response = await this.simulateLocalCall(prompt, cfg.localModelName, cfg.localMaxTokens, cfg.localTemperature);
    const latencyMs = Date.now() - startedAt;
    const inputTokens = estimateTokens(prompt);
    const outputTokens = estimateTokens(response);
    const analysis = this.buildAnalysis(cfg.localModelName, latencyMs, inputTokens, outputTokens);

    return {
      content: response,
      provider: this.providerType,
      model: cfg.localModelName,
      timestamp: Date.now(),
      metrics: {
        latencyMs,
        inputTokens,
        outputTokens,
        tokensPerSecond: calculateTps(outputTokens, latencyMs)
      },
      analysis
    };
  }

  private async simulateLocalCall(prompt: string, model: string, maxTokens: number, temperature: number): Promise<string> {
    const cfg = getConfiguration();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return `[LOCAL MODEL RESPONSE] Model=${model}\nURL=${cfg.localModelUrl || "not-configured"}\nMax tokens=${maxTokens}, Temp=${temperature}\n\nPrompt:\n${prompt}\n\nThis is a simulated local model response.`;
  }

  private buildAnalysis(model: string, latencyMs: number, inputTokens: number, outputTokens: number): string {
    return `Local analysis for model ${model}: latency ${latencyMs}ms, ${inputTokens} input tokens, ${outputTokens} output tokens, TPS ${calculateTps(outputTokens, latencyMs)}.`;
  }
}

export class RemoteModelProvider implements AIProvider {
  readonly providerType = "remote" as const;

  async call(prompt: string): Promise<ModelResponse> {
    const cfg = getConfiguration();
    const startedAt = Date.now();
    const response = await this.simulateRemoteCall(prompt, cfg.remoteModelName, cfg.remoteMaxTokens, cfg.remoteTemperature);
    const latencyMs = Date.now() - startedAt;
    const inputTokens = estimateTokens(prompt);
    const outputTokens = estimateTokens(response);
    const analysis = this.buildAnalysis(cfg.remoteModelName, latencyMs, inputTokens, outputTokens);

    return {
      content: response,
      provider: this.providerType,
      model: cfg.remoteModelName,
      timestamp: Date.now(),
      metrics: {
        latencyMs,
        inputTokens,
        outputTokens,
        tokensPerSecond: calculateTps(outputTokens, latencyMs)
      },
      analysis
    };
  }

  private async simulateRemoteCall(prompt: string, model: string, maxTokens: number, temperature: number): Promise<string> {
    const cfg = getConfiguration();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `[REMOTE MODEL RESPONSE] Model=${model}\nAPI Key Configured=${Boolean(cfg.remoteApiKey)}\nMax tokens=${maxTokens}, Temp=${temperature}\n\nPrompt:\n${prompt}\n\nThis is a simulated remote API response.`;
  }

  private buildAnalysis(model: string, latencyMs: number, inputTokens: number, outputTokens: number): string {
    return `Remote analysis for model ${model}: latency ${latencyMs}ms, ${inputTokens} input tokens, ${outputTokens} output tokens, TPS ${calculateTps(outputTokens, latencyMs)}.`;
  }
}

export class ModelProvider {
  private readonly local = new LocalModelProvider();
  private readonly remote = new RemoteModelProvider();

  async call(prompt: string, target: "local" | "remote" | "auto" = "auto"): Promise<ModelResponse> {
    if (target === "local") {
      return this.local.call(prompt);
    }
    if (target === "remote") {
      return this.remote.call(prompt);
    }

    const cfg = getConfiguration();
    if (cfg.localModelUrl) {
      return this.local.call(prompt);
    }

    return this.remote.call(prompt);
  }

  async benchmark(prompt: string): Promise<ModelResponse[]> {
    const calls: Promise<ModelResponse>[] = [];
    const cfg = getConfiguration();

    if (cfg.localModelUrl) {
      calls.push(this.local.call(prompt));
    }
    if (cfg.remoteApiKey) {
      calls.push(this.remote.call(prompt));
    }

    if (calls.length === 0) {
      throw new Error("No model endpoints are configured.");
    }

    return Promise.all(calls);
  }

  async loopTask(prompt: string, count: number, target: "local" | "remote" | "both" = "both"): Promise<ModelResponse[][]> {
    const groups: ModelResponse[][] = [];
    const cfg = getConfiguration();

    if ((target === "local" || target === "both") && cfg.localModelUrl) {
      const localRuns = [];
      for (let i = 0; i < count; i++) {
        localRuns.push(this.local.call(prompt));
      }
      groups.push(await Promise.all(localRuns));
    }

    if ((target === "remote" || target === "both") && cfg.remoteApiKey) {
      const remoteRuns = [];
      for (let i = 0; i < count; i++) {
        remoteRuns.push(this.remote.call(prompt));
      }
      groups.push(await Promise.all(remoteRuns));
    }

    if (groups.length === 0) {
      throw new Error("No configured endpoint available for loop task.");
    }

    return groups;
  }
}

export const modelProvider = new ModelProvider();
