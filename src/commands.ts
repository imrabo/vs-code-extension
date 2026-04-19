import * as vscode from "vscode";
import { getConfiguration, updateConfiguration } from "./config";
import { modelProvider, type ModelResponse } from "./providers";
import { renderConfigUI, ImraboPanelViewProvider } from "./ui";

let panelViewProvider: ImraboPanelViewProvider | undefined;
let chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
let lastBenchmarkResults: ModelResponse[] = [];

export function setPanelViewProvider(provider: ImraboPanelViewProvider): void {
  panelViewProvider = provider;
  provider.registerMessageHandler(handlePanelMessage);
}

async function showConfigDialog(): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    "imrabo.settings",
    "Imrabo Configuration",
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  renderConfigUI(panel, getConfiguration());

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message?.type !== "saveConfig") {
      return;
    }

    try {
      await updateConfiguration(message.payload ?? {});
      vscode.window.showInformationMessage("Imrabo settings saved.");
      renderConfigUI(panel, getConfiguration());
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to save settings: ${String(error)}`);
    }
  });
}

function pushResultsToPanel(results: ModelResponse[], title: string): void {
  lastBenchmarkResults = results;
  panelViewProvider?.showBenchmark(results, title);
}

function pushChatToPanel(status: string, analysis: string = ""): void {
  panelViewProvider?.showChat(chatHistory, status, analysis);
}

async function askPrompt(prompt: string, placeHolder: string): Promise<string | undefined> {
  return vscode.window.showInputBox({ prompt, placeHolder, ignoreFocusOut: true });
}

function canRunAtLeastOneEndpoint(): boolean {
  const cfg = getConfiguration();
  return Boolean(cfg.localModelUrl || cfg.remoteApiKey);
}

function handlePanelMessage(message: { type: string; payload?: any }): void {
  if (message.type === "sendChat" && message.payload?.prompt) {
    void sendChatMessage(String(message.payload.prompt));
    return;
  }

  if (message.type === "ready") {
    if (chatHistory.length > 0) {
      pushChatToPanel("Ready");
    }
    if (lastBenchmarkResults.length > 0) {
      pushResultsToPanel(lastBenchmarkResults, "Latest benchmark results");
    }
    return;
  }
}

async function sendChatMessage(prompt: string): Promise<void> {
  const cfg = getConfiguration();
  if (!cfg.enabled || !canRunAtLeastOneEndpoint()) {
    await showConfigDialog();
    return;
  }

  chatHistory.push({ role: "user", content: prompt });
  pushChatToPanel("Sending prompt to model...");

  try {
    const result = await modelProvider.call(prompt, "auto");
    chatHistory.push({ role: "assistant", content: result.content });
    const analysis = `Analysis: ${result.analysis}`;
    pushChatToPanel("Response received.", analysis);
    pushResultsToPanel([result], "Latest chat benchmark");
  } catch (error) {
    const message = String(error);
    chatHistory.push({ role: "assistant", content: `Error: ${message}` });
    pushChatToPanel("Failed to get a response.", "");
  }
}

export async function runLocalModel(): Promise<void> {
  const cfg = getConfiguration();
  if (!cfg.enabled || !cfg.localModelUrl) {
    await showConfigDialog();
    return;
  }

  const prompt = await askPrompt("Enter your request for local model", `Local URL: ${cfg.localModelUrl}`);
  if (!prompt) {
    return;
  }

  try {
    const result = await modelProvider.call(prompt, "local");
    pushResultsToPanel([result], "Local benchmark result");
  } catch (error) {
    vscode.window.showErrorMessage(`Local model failed: ${String(error)}`);
  }
}

export async function runRemoteModel(): Promise<void> {
  const cfg = getConfiguration();
  if (!cfg.enabled || !cfg.remoteApiKey) {
    await showConfigDialog();
    return;
  }

  const prompt = await askPrompt("Enter your request for remote model", `Model: ${cfg.remoteModelName}`);
  if (!prompt) {
    return;
  }

  try {
    const result = await modelProvider.call(prompt, "remote");
    pushResultsToPanel([result], "Remote benchmark result");
  } catch (error) {
    vscode.window.showErrorMessage(`Remote model failed: ${String(error)}`);
  }
}

export async function benchmarkPrompt(): Promise<void> {
  const cfg = getConfiguration();
  if (!cfg.enabled || !canRunAtLeastOneEndpoint()) {
    await showConfigDialog();
    return;
  }

  const prompt = await askPrompt(
    "Enter prompt for Local vs Remote benchmarking",
    "The same prompt is sent to all configured endpoints"
  );
  if (!prompt) {
    return;
  }

  try {
    const results = await modelProvider.benchmark(prompt);
    pushResultsToPanel(results, "Local vs Remote benchmark comparison");
  } catch (error) {
    vscode.window.showErrorMessage(`Benchmark failed: ${String(error)}`);
  }
}

export async function generateCode(): Promise<void> {
  if (!canRunAtLeastOneEndpoint()) {
    await showConfigDialog();
    return;
  }

  const prompt = await askPrompt(
    "Enter your code generation request",
    "Example: Build a TypeScript debounce utility with tests"
  );
  if (!prompt) {
    return;
  }

  try {
    const results = await modelProvider.benchmark(prompt);
    pushResultsToPanel(results, "Code generation benchmark");
  } catch (error) {
    vscode.window.showErrorMessage(`Code generation failed: ${String(error)}`);
  }
}

export async function analyzeText(): Promise<void> {
  if (!canRunAtLeastOneEndpoint()) {
    await showConfigDialog();
    return;
  }

  const prompt = await askPrompt("Enter text to analyze", "Example: Analyze this snippet for complexity");
  if (!prompt) {
    return;
  }

  try {
    const results = await modelProvider.benchmark(prompt);
    pushResultsToPanel(results, "Text analysis benchmark");
  } catch (error) {
    vscode.window.showErrorMessage(`Text analysis failed: ${String(error)}`);
  }
}

export async function openChat(): Promise<void> {
  if (!panelViewProvider) {
    vscode.window.showErrorMessage("Imrabo panel is not available.");
    return;
  }

  pushChatToPanel("Chat ready. Send a message to begin.", "Use the chat tab to send prompts and receive analysis below each response.");
}

export async function runLoopTask(): Promise<void> {
  const cfg = getConfiguration();
  if (!cfg.enabled || !canRunAtLeastOneEndpoint()) {
    await showConfigDialog();
    return;
  }

  const prompt = await askPrompt("Enter the prompt to loop", "Example: Refactor this function repeatedly");
  if (!prompt) {
    return;
  }

  const amountText = await askPrompt("How many times should this task loop?", String(cfg.loopTaskCount));
  if (!amountText) {
    return;
  }

  const loopCount = Number(amountText);
  if (!Number.isFinite(loopCount) || loopCount <= 0) {
    vscode.window.showErrorMessage("Loop count must be a positive number.");
    return;
  }

  try {
    const groups = await modelProvider.loopTask(prompt, loopCount, cfg.localModelUrl ? "both" : "remote");
    const summary = groups.map((group, index) => {
      const provider = group[0]?.provider ?? "unknown";
      return `Loop results for ${provider}:\n${group.map((item, run) => `Run ${run + 1}: ${item.metrics.latencyMs}ms, ${item.metrics.tokensPerSecond} TPS`).join("\n")}`;
    }).join("\n\n");
    vscode.window.showInformationMessage("Loop task completed.");
    panelViewProvider?.showChat(chatHistory, "Loop task completed.", summary);
  } catch (error) {
    vscode.window.showErrorMessage(`Loop task failed: ${String(error)}`);
  }
}

export async function configureModels(): Promise<void> {
  await showConfigDialog();
}
