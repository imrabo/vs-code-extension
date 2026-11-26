import * as vscode from "vscode";

export interface AIConfig {
  enabled: boolean;
  mode: "local" | "remote" | "hybrid";
  localModelUrl: string;
  localModelName: string;
  localMaxTokens: number;
  localTemperature: number;
  remoteProvider: "openai" | "anthropic" | "custom";
  remoteApiKey: string;
  remoteModelName: string;
  remoteMaxTokens: number;
  remoteTemperature: number;
  loopTaskCount: number;
  contextLength: number;
  enableMarketplace: boolean;
  marketplaceUrl: string;
  marketplaceRefreshInterval: number;
  installedSkills: string[];
  maxTokens: number;
  temperature: number;
}

let config: AIConfig = {
  enabled: true,
  mode: "hybrid",
  localModelUrl: "",
  localModelName: "llama3",
  localMaxTokens: 1024,
  localTemperature: 0.5,
  remoteProvider: "openai",
  remoteApiKey: "",
  remoteModelName: "gpt-4o",
  remoteMaxTokens: 2048,
  remoteTemperature: 0.7,
  loopTaskCount: 3,
  contextLength: 2048,
  enableMarketplace: true,
  marketplaceUrl: "https://example.com/imrabo-marketplace",
  marketplaceRefreshInterval: 60,
  installedSkills: [],
  maxTokens: 2048,
  temperature: 0.7
};

export async function loadConfiguration(): Promise<void> {
  const workspaceConfig = vscode.workspace.getConfiguration("imrabo");

  config = {
    enabled: workspaceConfig.get<boolean>("enabled") ?? true,
    mode: workspaceConfig.get<AIConfig["mode"]>("mode") ?? "hybrid",
    localModelUrl: workspaceConfig.get<string>("localModelUrl") ?? "",
    localModelName: workspaceConfig.get<string>("localModelName") ?? "llama3",
    localMaxTokens: workspaceConfig.get<number>("localMaxTokens") ?? 1024,
    localTemperature: workspaceConfig.get<number>("localTemperature") ?? 0.5,
    remoteProvider: workspaceConfig.get<AIConfig["remoteProvider"]>("remoteProvider") ?? "openai",
    remoteApiKey: workspaceConfig.get<string>("remoteApiKey") ?? "",
    remoteModelName: workspaceConfig.get<string>("remoteModelName") ?? "gpt-4o",
    remoteMaxTokens: workspaceConfig.get<number>("remoteMaxTokens") ?? 2048,
    remoteTemperature: workspaceConfig.get<number>("remoteTemperature") ?? 0.7,
    loopTaskCount: workspaceConfig.get<number>("loopTaskCount") ?? 3,
    contextLength: workspaceConfig.get<number>("contextLength") ?? 2048,
    enableMarketplace: workspaceConfig.get<boolean>("enableMarketplace") ?? true,
    marketplaceUrl: workspaceConfig.get<string>("marketplaceUrl") ?? "https://example.com/imrabo-marketplace",
    marketplaceRefreshInterval: workspaceConfig.get<number>("marketplaceRefreshInterval") ?? 60,
    installedSkills: workspaceConfig.get<string[]>("installedSkills") ?? [],
    maxTokens: workspaceConfig.get<number>("maxTokens") ?? 2048,
    temperature: workspaceConfig.get<number>("temperature") ?? 0.7
  };
}

export async function updateConfiguration(partial: Partial<AIConfig>): Promise<void> {
  config = { ...config, ...partial };

  const workspaceConfig = vscode.workspace.getConfiguration("imrabo");
  for (const key of Object.keys(partial) as Array<keyof AIConfig>) {
    const currentValue = workspaceConfig.get(key);
    const newValue = partial[key];
    if (currentValue !== newValue) {
      await workspaceConfig.update(key, newValue, vscode.ConfigurationTarget.Workspace);
    }
  }
}

export function getConfiguration(): AIConfig {
  return config;
}
