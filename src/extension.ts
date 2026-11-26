import * as vscode from "vscode";
import { loadConfiguration } from "./config";
import { Logger } from "./logger";
import {
  analyzeText,
  benchmarkPrompt,
  configureModels,
  createTests,
  explainCode,
  fixCode,
  generateCode,
  openChat,
  openMarketplace,
  runLocalModel,
  runLoopTask,
  runRemoteModel,
  setPanelViewProvider,
  summarizeFile
} from "./commands";
import { ImraboPanelViewProvider } from "./ui";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  Logger.initialize();
  Logger.info("Activating Imrabo AI Orchestration extension...");
  await loadConfiguration();

  const panelProvider = new ImraboPanelViewProvider();
  setPanelViewProvider(panelProvider);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ImraboPanelViewProvider.viewType, panelProvider),
    vscode.commands.registerCommand("imrabo.runLocalModel", runLocalModel),
    vscode.commands.registerCommand("imrabo.runRemoteModel", runRemoteModel),
    vscode.commands.registerCommand("imrabo.generateCode", generateCode),
    vscode.commands.registerCommand("imrabo.analyzeText", analyzeText),
    vscode.commands.registerCommand("imrabo.explainCode", explainCode),
    vscode.commands.registerCommand("imrabo.fixCode", fixCode),
    vscode.commands.registerCommand("imrabo.createTests", createTests),
    vscode.commands.registerCommand("imrabo.summarizeFile", summarizeFile),
    vscode.commands.registerCommand("imrabo.configureModels", configureModels),
    vscode.commands.registerCommand("imrabo.benchmarkPrompt", benchmarkPrompt),
    vscode.commands.registerCommand("imrabo.openChat", openChat),
    vscode.commands.registerCommand("imrabo.openMarketplace", openMarketplace),
    vscode.commands.registerCommand("imrabo.loopTask", runLoopTask),
    vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration("imrabo")) {
        await loadConfiguration();
      }
    })
  );

  Logger.info("Imrabo AI Orchestration extension successfully activated.");
  vscode.window.showInformationMessage("Imrabo AI Orchestration activated.");
}

export function deactivate(): void {
  Logger.info("Deactivating Imrabo AI Orchestration extension...");
}
