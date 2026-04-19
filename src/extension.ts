import * as vscode from "vscode";
import { loadConfiguration } from "./config";
import {
  analyzeText,
  benchmarkPrompt,
  configureModels,
  generateCode,
  openChat,
  runLocalModel,
  runLoopTask,
  runRemoteModel,
  setPanelViewProvider
} from "./commands";
import { ImraboPanelViewProvider } from "./ui";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  await loadConfiguration();

  const panelProvider = new ImraboPanelViewProvider();
  setPanelViewProvider(panelProvider);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ImraboPanelViewProvider.viewType, panelProvider),
    vscode.commands.registerCommand("imrabo.runLocalModel", runLocalModel),
    vscode.commands.registerCommand("imrabo.runRemoteModel", runRemoteModel),
    vscode.commands.registerCommand("imrabo.generateCode", generateCode),
    vscode.commands.registerCommand("imrabo.analyzeText", analyzeText),
    vscode.commands.registerCommand("imrabo.configureModels", configureModels),
    vscode.commands.registerCommand("imrabo.benchmarkPrompt", benchmarkPrompt),
    vscode.commands.registerCommand("imrabo.openChat", openChat),
    vscode.commands.registerCommand("imrabo.loopTask", runLoopTask),
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration("imrabo")) {
        await loadConfiguration();
      }
    })
  );

  vscode.window.showInformationMessage("Imrabo AI Orchestration activated.");
}

export function deactivate(): void {
  // No-op cleanup.
}
