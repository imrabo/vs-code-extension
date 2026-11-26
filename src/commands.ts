import * as vscode from "vscode";
import { getConfiguration, updateConfiguration } from "./config";
import { modelProvider, type ModelResponse } from "./providers";
import { skillsCatalog } from "./marketplace";
import { renderConfigUI, ImraboPanelViewProvider } from "./ui";
import { Logger } from "./logger";

let panelViewProvider: ImraboPanelViewProvider | undefined;
let chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
let lastBenchmarkResults: ModelResponse[] = [];

export function setPanelViewProvider(provider: ImraboPanelViewProvider): void {
  panelViewProvider = provider;
  provider.registerMessageHandler(handlePanelMessage);
}

async function showConfigDialog(): Promise<void> {
  Logger.info("Opening Imrabo configuration dialog...");
  let isDisposed = false;
  const panel = vscode.window.createWebviewPanel(
    "imrabo.settings",
    "Imrabo Configuration",
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  panel.onDidDispose(() => {
    isDisposed = true;
    Logger.info("Imrabo configuration dialog closed.");
  });

  renderConfigUI(panel, getConfiguration());

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message?.type !== "saveConfig") {
      return;
    }

    try {
      Logger.info("Saving settings requested from settings panel...");
      await updateConfiguration(message.payload ?? {});
      vscode.window.showInformationMessage("Imrabo settings saved.");
      if (!isDisposed) {
        renderConfigUI(panel, getConfiguration());
      }
    } catch (error) {
      Logger.error("Failed to save settings from settings panel", error);
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

async function runAgentTask(prompt: string, title: string): Promise<void> {
  Logger.info(`Running agent task "${title}" with prompt: "${prompt.slice(0, 100)}..."`);
  const cfg = getConfiguration();
  if (!cfg.enabled || !canRunAtLeastOneEndpoint()) {
    Logger.warn("Agent execution blocked: Imrabo is disabled or no endpoints are configured.");
    await showConfigDialog();
    return;
  }

  chatHistory.push({ role: "user", content: prompt });
  pushChatToPanel(title, "Sending request to coding agent...");

  try {
    const result = await modelProvider.call(prompt, "auto");
    chatHistory.push({ role: "assistant", content: result.content });
    const analysis = `Analysis: ${result.analysis}`;
    pushChatToPanel(title, analysis);
    panelViewProvider?.showToolsResult(result.content, title);
    Logger.info(`Agent task "${title}" completed successfully.`);
  } catch (error) {
    Logger.error(`Agent task "${title}" failed`, error);
    const message = String(error);
    chatHistory.push({ role: "assistant", content: `Error: ${message}` });
    pushChatToPanel("Failed", "");
    panelViewProvider?.showToolsResult(`Error: ${message}`, "Failed to run coding agent task.");
  }
}

async function askPrompt(prompt: string, placeHolder: string): Promise<string | undefined> {
  return vscode.window.showInputBox({ prompt, placeHolder, ignoreFocusOut: true });
}

function canRunAtLeastOneEndpoint(): boolean {
  const cfg = getConfiguration();
  return Boolean(cfg.localModelUrl || cfg.remoteApiKey);
}

function handlePanelMessage(message: { type: string; payload?: any }): void {
  Logger.info(`Received webview panel message: ${message.type}`);
  if (message.type === "sendChat" && message.payload?.prompt) {
    void sendChatMessage(String(message.payload.prompt));
    return;
  }

  if (message.type === "saveConfig" && message.payload) {
    void (async () => {
      try {
        Logger.info("Saving settings requested from sidebar webview panel...");
        await updateConfiguration(message.payload);
        vscode.window.showInformationMessage("Imrabo settings saved.");
        panelViewProvider?.showConfig(getConfiguration());
        Logger.info("Settings saved successfully.");
      } catch (error) {
        Logger.error("Failed to save settings from sidebar panel", error);
        vscode.window.showErrorMessage(`Failed to save settings: ${String(error)}`);
      }
    })();
    return;
  }

  if (message.type === "agentCommand" && message.payload?.command) {
    const command = String(message.payload.command);
    switch (command) {
      case "generateCode":
        void generateCode();
        break;
      case "analyzeText":
        void analyzeText();
        break;
      case "explainCode":
        void explainCode();
        break;
      case "fixCode":
        void fixCode();
        break;
      case "createTests":
        void createTests();
        break;
      case "summarizeFile":
        void summarizeFile();
        break;
      default:
        break;
    }
    return;
  }

  if (message.type === "installSkill" && message.payload?.skillId) {
    const skillId = String(message.payload.skillId);
    const skill = skillsCatalog.find((item) => item.id === skillId);
    if (skill) {
      vscode.window.showInformationMessage(`Installing skill: ${skill.name}`);
      panelViewProvider?.showMarketplace(skillsCatalog, `Installed skill ${skill.name}.`);
    }
    return;
  }

  if (message.type === "ready") {
    if (chatHistory.length > 0) {
      pushChatToPanel("Ready");
    }
    if (lastBenchmarkResults.length > 0) {
      pushResultsToPanel(lastBenchmarkResults, "Latest benchmark results");
    }
    panelViewProvider?.showConfig(getConfiguration());
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
  const prompt = await askPrompt(
    "Enter your code generation request",
    "Example: Build a TypeScript debounce utility with tests"
  );
  if (!prompt) {
    return;
  }

  await runAgentTask(`Generate production-ready code:\n${prompt}`, "Generate Code");
}

export async function analyzeText(): Promise<void> {
  const prompt = await askPrompt("Enter text to analyze", "Example: Analyze this snippet for complexity");
  if (!prompt) {
    return;
  }

  await runAgentTask(`Analyze this text and provide coding recommendations:\n${prompt}`, "Analyze Text");
}

export async function explainCode(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  let prompt: string | undefined;

  if (editor && !editor.selection.isEmpty) {
    const selection = editor.document.getText(editor.selection);
    prompt = `Explain the following code in a way a developer can understand:\n${selection}`;
  } else {
    const request = await askPrompt("Enter the code to explain", "Paste code or a function snippet here");
    if (!request) {
      return;
    }
    prompt = `Explain the following code:\n${request}`;
  }

  await runAgentTask(prompt, "Explain Code");
}

export async function fixCode(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  let prompt: string | undefined;

  if (editor && !editor.selection.isEmpty) {
    const selection = editor.document.getText(editor.selection);
    prompt = `Fix and optimize the following code; keep behavior intact:\n${selection}`;
  } else {
    const request = await askPrompt("Enter the code to fix", "Paste the problematic code here");
    if (!request) {
      return;
    }
    prompt = `Fix and optimize the following code; keep behavior intact:\n${request}`;
  }

  await runAgentTask(prompt, "Fix Code");
}

export async function createTests(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  let prompt: string | undefined;

  if (editor && !editor.selection.isEmpty) {
    const selection = editor.document.getText(editor.selection);
    prompt = `Create unit tests for the following code:\n${selection}`;
  } else {
    const request = await askPrompt("Enter code for test generation", "Paste the function or module to test");
    if (!request) {
      return;
    }
    prompt = `Create unit tests for the following code:\n${request}`;
  }

  await runAgentTask(prompt, "Create Unit Tests");
}

export async function summarizeFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("Open a file to summarize it.");
    return;
  }

  const content = editor.document.getText();
  if (!content.trim()) {
    vscode.window.showErrorMessage("The current file is empty.");
    return;
  }

  await runAgentTask(`Summarize the purpose and structure of this file:\n${content}`, "Summarize File");
}

export async function openChat(): Promise<void> {
  if (!panelViewProvider) {
    vscode.window.showErrorMessage("Imrabo panel is not available.");
    return;
  }

  pushChatToPanel("Chat ready. Send a message to begin.", "Use the chat tab to send prompts and receive analysis below each response.");
}

export async function openMarketplace(): Promise<void> {
  const cfg = getConfiguration();
  if (!cfg.enableMarketplace) {
    vscode.window.showInformationMessage("Marketplace is disabled in Imrabo settings.");
    return;
  }

  if (!panelViewProvider) {
    vscode.window.showErrorMessage("Imrabo panel is not available.");
    return;
  }

  panelViewProvider.showMarketplace(skillsCatalog, "Browse skills and MCP-enabled extensions.");
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
    const summary = groups.map((group) => {
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
