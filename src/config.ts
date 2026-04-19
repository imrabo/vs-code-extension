import * as vscode from "vscode";

export interface AIConfig {
  enabled: boolean;
  localModelUrl: string;
  localModelName: string;
  localMaxTokens: number;
  localTemperature: number;
  remoteApiKey: string;
  remoteModelName: string;
  remoteMaxTokens: number;
  remoteTemperature: number;
  loopTaskCount: number;
  maxTokens: number;
  temperature: number;
}

let config: AIConfig = {
  enabled: true,
  localModelUrl: "",
  localModelName: "llama3",
  localMaxTokens: 1024,
  localTemperature: 0.5,
  remoteApiKey: "",
  remoteModelName: "gpt-4o",
  remoteMaxTokens: 2048,
  remoteTemperature: 0.7,
  loopTaskCount: 3,
  maxTokens: 2048,
  temperature: 0.7
};

export async function loadConfiguration(): Promise<void> {
  const workspaceConfig = vscode.workspace.getConfiguration("imrabo");

  config = {
    enabled: workspaceConfig.get<boolean>("enabled") ?? true,
    localModelUrl: workspaceConfig.get<string>("localModelUrl") ?? "",
    localModelName: workspaceConfig.get<string>("localModelName") ?? "llama3",
    localMaxTokens: workspaceConfig.get<number>("localMaxTokens") ?? 1024,
    localTemperature: workspaceConfig.get<number>("localTemperature") ?? 0.5,
    remoteApiKey: workspaceConfig.get<string>("remoteApiKey") ?? "",
    remoteModelName: workspaceConfig.get<string>("remoteModelName") ?? "gpt-4o",
    remoteMaxTokens: workspaceConfig.get<number>("remoteMaxTokens") ?? 2048,
    remoteTemperature: workspaceConfig.get<number>("remoteTemperature") ?? 0.7,
    loopTaskCount: workspaceConfig.get<number>("loopTaskCount") ?? 3,
    maxTokens: workspaceConfig.get<number>("maxTokens") ?? 2048,
    temperature: workspaceConfig.get<number>("temperature") ?? 0.7
  };
}

export async function updateConfiguration(partial: Partial<AIConfig>): Promise<void> {
  config = { ...config, ...partial };

  const workspaceConfig = vscode.workspace.getConfiguration("imrabo");
  await Promise.all([
    workspaceConfig.update("enabled", config.enabled, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("localModelUrl", config.localModelUrl, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("localModelName", config.localModelName, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("localMaxTokens", config.localMaxTokens, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("localTemperature", config.localTemperature, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("remoteApiKey", config.remoteApiKey, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("remoteModelName", config.remoteModelName, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("remoteMaxTokens", config.remoteMaxTokens, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("remoteTemperature", config.remoteTemperature, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("loopTaskCount", config.loopTaskCount, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("maxTokens", config.maxTokens, vscode.ConfigurationTarget.Workspace),
    workspaceConfig.update("temperature", config.temperature, vscode.ConfigurationTarget.Workspace)
  ]);
}

export function getConfiguration(): AIConfig {
  return config;
}
