import * as vscode from "vscode";
import type { AIConfig } from "./config";
import type { ModelResponse } from "./providers";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export interface ImraboPanelMessageHandler {
  (message: { type: string; payload?: any }): void;
}

export class ImraboPanelViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "imrabo.panel";

  private currentView: vscode.WebviewView | undefined;
  private messageHandler: ImraboPanelMessageHandler | undefined;

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.currentView = webviewView;
    const nonce = getNonce();
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.buildPanelHtml(nonce);
    webviewView.webview.onDidReceiveMessage((message) => {
      this.messageHandler?.(message);
    });
    webviewView.onDidDispose(() => {
      this.currentView = undefined;
    });
  }

  registerMessageHandler(handler: ImraboPanelMessageHandler): void {
    this.messageHandler = handler;
  }

  showBenchmark(results: ModelResponse[], title: string): void {
    if (!this.currentView) {
      return;
    }
    try {
      this.currentView.webview.postMessage({ type: "benchmark", payload: { title, results } });
    } catch (error) {
      // Safely ignore if webview is disposed
    }
  }

  showChat(history: Array<{ role: string; content: string }>, status: string, analysis: string): void {
    if (!this.currentView) {
      return;
    }
    try {
      this.currentView.webview.postMessage({ type: "chat", payload: { history, status, analysis } });
    } catch (error) {
      // Safely ignore if webview is disposed
    }
  }

  showConfig(config: any): void {
    if (!this.currentView) {
      return;
    }
    try {
      this.currentView.webview.postMessage({ type: "config", payload: config });
    } catch (error) {
      // Safely ignore if webview is disposed
    }
  }

  showToolsResult(result: string, title: string): void {
    if (!this.currentView) {
      return;
    }
    try {
      this.currentView.webview.postMessage({ type: "toolsResult", payload: { result, title } });
    } catch (error) {
      // Safely ignore if webview is disposed
    }
  }

  showMarketplace(skills: any[], title: string): void {
    if (!this.currentView) {
      return;
    }
    try {
      this.currentView.webview.postMessage({ type: "marketplace", payload: { skills, title } });
    } catch (error) {
      // Safely ignore if webview is disposed
    }
  }

  private buildPanelHtml(nonce: string): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'nonce-${nonce}'; img-src 'self' data: https:;" />
    <title>Imrabo AI Assistant</title>
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: "Inter", "Segoe UI", sans-serif;
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
      }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 12px;
        background: var(--vscode-titleBar-activeBackground);
        border-bottom: 1px solid var(--vscode-editorWidget-border);
      }
      .toolbar button {
        flex: 1 1 auto;
        min-width: 110px;
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-radius: 6px;
        padding: 10px 14px;
        cursor: pointer;
        font-size: 0.95rem;
      }
      .toolbar button.active {
        background: var(--vscode-button-hoverBackground);
      }
      .content {
        padding: 16px;
        max-width: 1180px;
        margin: 0 auto;
        box-sizing: border-box;
      }
      .panel {
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 12px;
        background: var(--vscode-panel-background);
        padding: 16px;
      }
      .section {
        display: none;
      }
      .section.active {
        display: block;
      }
      .chat-history {
        min-height: 220px;
        max-height: 380px;
        overflow-y: auto;
        padding: 12px;
        border-bottom: 1px solid var(--vscode-editorWidget-border);
      }
      .message {
        margin-bottom: 12px;
        line-height: 1.5;
      }
      .message.user {
        text-align: right;
      }
      .message.assistant {
        text-align: left;
      }
      .bubble {
        display: inline-block;
        padding: 10px 12px;
        max-width: 85%;
        border-radius: 12px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        box-shadow: 0 1px 2px rgba(0,0,0,0.08);
      }
      .input-row {
        position: relative;
        margin-top: 12px;
      }
      .input-row textarea {
        width: 100%;
        min-height: 120px;
        resize: vertical;
        padding: 14px 126px 14px 14px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 14px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        box-sizing: border-box;
        font-family: "Inter", "Segoe UI", sans-serif;
        font-size: 1rem;
        line-height: 1.5;
      }
      .input-row button {
        position: absolute;
        right: 14px;
        bottom: 14px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 8px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        padding: 10px 14px;
        cursor: pointer;
        z-index: 1;
        font-weight: 600;
      }
      .analysis-output {
        margin-top: 12px;
        padding: 14px;
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 10px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        white-space: pre-wrap;
      }
      .benchmark-table {
        width: 100%;
        border-collapse: collapse;
      }
      .benchmark-table th,
      .benchmark-table td {
        padding: 10px 8px;
        border-bottom: 1px solid var(--vscode-editorWidget-border);
      }
      .benchmark-table th {
        text-align: left;
        cursor: pointer;
      }
      .benchmark-output {
        padding: 12px;
        white-space: pre-wrap;
        background: var(--vscode-input-background);
        border-top: 1px solid var(--vscode-editorWidget-border);
        border-radius: 0 0 8px 8px;
      }
      .hint {
        margin-top: 10px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }
      .tool-button {
        border: 1px solid var(--vscode-input-border);
        border-radius: 12px;
        padding: 14px 16px;
        text-align: left;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        cursor: pointer;
        font-weight: 600;
        width: 100%;
        box-sizing: border-box;
      }
      .tool-button:hover {
        background: var(--vscode-button-hoverBackground);
      }
      .config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 14px;
        margin-top: 16px;
      }
      .config-grid label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.9rem;
        color: var(--vscode-foreground);
      }
      .config-grid input,
      .config-grid select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 8px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
        box-sizing: border-box;
        font-family: "Inter", "Segoe UI", sans-serif;
      }
      .form-actions {
        margin-top: 18px;
      }
      .form-actions button {
        border: none;
        border-radius: 10px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        padding: 12px 18px;
        font-weight: 700;
        cursor: pointer;
      }
      .marketplace-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
        margin-top: 12px;
      }
      .panel-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .panel-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--vscode-button-hoverBackground);
        color: var(--vscode-button-foreground);
        font-size: 1rem;
        font-weight: 700;
      }
      .panel-title {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
      }
      .panel-subtitle {
        margin: 0;
        color: var(--vscode-descriptionForeground);
        font-size: 0.95rem;
      }
      .skill-card {
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 12px;
        padding: 14px;
        background: var(--vscode-input-background);
      }
      .skill-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }
      .skill-description {
        margin-bottom: 8px;
        color: var(--vscode-foreground);
      }
      .skill-meta {
        margin-bottom: 8px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
      }
      .skill-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 10px;
      }
      .skill-tag {
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-radius: 999px;
        padding: 3px 10px;
        font-size: 11px;
      }
      .installSkill {
        border: none;
        border-radius: 6px;
        padding: 8px 12px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        cursor: pointer;
      }
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 10px;
        margin-bottom: 14px;
      }
      .tool-button {
        border: 1px solid var(--vscode-input-border);
        border-radius: 8px;
        padding: 12px 14px;
        text-align: left;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        cursor: pointer;
        font-weight: 600;
      }
      .tool-button:hover {
        background: var(--vscode-button-hoverBackground);
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button id="chatTab" class="active">Chat</button>
      <button id="benchmarkTab">Code Tools</button>
      <button id="marketplaceTab">Marketplace</button>
      <button id="configTab">Config</button>
    </div>
    <div class="content">
      <div class="panel-header">
        <div class="panel-icon">AI</div>
        <div>
          <p class="panel-title">Imrabo Coding Agent</p>
          <p class="panel-subtitle">Responsive code assistance for VS Code with Inter font styling.</p>
        </div>
      </div>
      <div id="chatSection" class="section active panel">
        <div class="chat-history" id="chatHistory"></div>
        <div id="analysisSection" class="analysis-output">No analysis yet.</div>
        <div class="input-row">
          <textarea id="chatInput" placeholder="Ask the model anything..."></textarea>
          <button id="sendChat">Send</button>
        </div>
        <div class="hint">Chat using the configured local or remote model. Use Ctrl+Enter or Cmd+Enter to send; Shift+Enter inserts a newline.</div>
      </div>

      <div id="benchmarkSection" class="section panel">
        <div class="hint">Use Imrabo as a coding assistant: generate code, explain selection, fix issues, create tests, and summarize files.</div>
        <div class="tools-grid">
          <button class="tool-button" data-command="generateCode">Generate Code</button>
          <button class="tool-button" data-command="analyzeText">Analyze Text</button>
          <button class="tool-button" data-command="explainCode">Explain Selection</button>
          <button class="tool-button" data-command="fixCode">Fix Code</button>
          <button class="tool-button" data-command="createTests">Create Unit Tests</button>
          <button class="tool-button" data-command="summarizeFile">Summarize Current File</button>
        </div>
        <div id="toolsOutput" class="benchmark-output">Run any coding action to see results here.</div>
        <div id="benchmarkDetails" style="margin-top: 16px; font-weight: 600;">No benchmark data available.</div>
        <table class="benchmark-table" style="margin-top: 8px; width: 100%;">
          <thead>
            <tr>
              <th data-col="0">Provider</th>
              <th data-col="1">Model</th>
              <th data-col="2">Latency (ms)</th>
              <th data-col="3">Input</th>
              <th data-col="4">Output</th>
              <th data-col="5">TPS</th>
            </tr>
          </thead>
          <tbody id="benchmarkBody">
            <tr><td colspan="6">No benchmark results available.</td></tr>
          </tbody>
        </table>
        <div class="hint" style="margin-top: 12px;">This section exposes coding agent actions for the active editor and workspace, not only benchmarks.</div>
      </div>

      <div id="marketplaceSection" class="section panel">
        <div class="hint">Browse available skills and install MCP-enabled extensions.</div>
        <div id="marketplaceCards" class="marketplace-cards"></div>
      </div>

      <div id="configSection" class="section panel">
        <div class="hint">Configure local and remote model providers directly in the Imrabo panel.</div>
        <div class="config-grid">
          <div>
            <label for="enabled">Enable Imrabo</label>
            <input type="checkbox" id="enabled" />
          </div>
          <div>
            <label for="mode">Execution Mode</label>
            <select id="mode">
              <option value="local">Local only</option>
              <option value="remote">Remote only</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label for="localModelUrl">Local Model URL</label>
            <input id="localModelUrl" placeholder="http://localhost:11434" />
          </div>
          <div>
            <label for="localModelName">Local Model Name</label>
            <input id="localModelName" placeholder="e.g. llama3" />
          </div>
          <div>
            <label for="remoteProvider">Remote Provider</label>
            <select id="remoteProvider">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label for="remoteApiKey">Remote API Key</label>
            <input id="remoteApiKey" type="password" placeholder="Remote API key" />
          </div>
          <div>
            <label for="remoteModelName">Remote Model Name</label>
            <input id="remoteModelName" placeholder="e.g. gpt-4o" />
          </div>
          <div>
            <label for="localMaxTokens">Local Max Tokens</label>
            <input id="localMaxTokens" type="number" min="1" />
          </div>
          <div>
            <label for="remoteMaxTokens">Remote Max Tokens</label>
            <input id="remoteMaxTokens" type="number" min="1" />
          </div>
          <div>
            <label for="localTemperature">Local Temperature</label>
            <input id="localTemperature" type="number" min="0" max="1" step="0.1" />
          </div>
          <div>
            <label for="remoteTemperature">Remote Temperature</label>
            <input id="remoteTemperature" type="number" min="0" max="1" step="0.1" />
          </div>
          <div>
            <label for="contextLength">Context Length</label>
            <input id="contextLength" type="number" min="1" />
          </div>
          <div>
            <label for="loopTaskCount">Loop Task Count</label>
            <input id="loopTaskCount" type="number" min="1" />
          </div>
          <div>
            <label for="enableMarketplace">Enable Marketplace</label>
            <input type="checkbox" id="enableMarketplace" />
          </div>
          <div>
            <label for="marketplaceUrl">Marketplace URL</label>
            <input id="marketplaceUrl" placeholder="https://example.com/imrabo-marketplace" />
          </div>
          <div>
            <label for="maxTokens">Max Tokens</label>
            <input id="maxTokens" type="number" min="1" />
          </div>
          <div>
            <label for="temperature">Temperature</label>
            <input id="temperature" type="number" min="0" max="1" step="0.1" />
          </div>
        </div>
        <div class="form-actions">
          <button id="saveConfig">Save Settings</button>
        </div>
      </div>
    </div>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      const chatTab = document.getElementById("chatTab");
      const benchmarkTab = document.getElementById("benchmarkTab");
      const marketplaceTab = document.getElementById("marketplaceTab");
      const configTab = document.getElementById("configTab");
      const chatSection = document.getElementById("chatSection");
      const benchmarkSection = document.getElementById("benchmarkSection");
      const marketplaceSection = document.getElementById("marketplaceSection");
      const configSection = document.getElementById("configSection");
      const chatHistory = document.getElementById("chatHistory");
      const benchmarkBody = document.getElementById("benchmarkBody");
      const benchmarkDetails = document.getElementById("benchmarkDetails");
      const toolsOutput = document.getElementById("toolsOutput");
      const marketplaceCards = document.getElementById("marketplaceCards");
      const chatInput = document.getElementById("chatInput");
      const sendChat = document.getElementById("sendChat");
      const saveConfig = document.getElementById("saveConfig");
      const configFields = {
        enabled: document.getElementById("enabled"),
        mode: document.getElementById("mode"),
        localModelUrl: document.getElementById("localModelUrl"),
        localModelName: document.getElementById("localModelName"),
        localMaxTokens: document.getElementById("localMaxTokens"),
        localTemperature: document.getElementById("localTemperature"),
        remoteProvider: document.getElementById("remoteProvider"),
        remoteApiKey: document.getElementById("remoteApiKey"),
        remoteModelName: document.getElementById("remoteModelName"),
        remoteMaxTokens: document.getElementById("remoteMaxTokens"),
        remoteTemperature: document.getElementById("remoteTemperature"),
        contextLength: document.getElementById("contextLength"),
        loopTaskCount: document.getElementById("loopTaskCount"),
        enableMarketplace: document.getElementById("enableMarketplace"),
        marketplaceUrl: document.getElementById("marketplaceUrl"),
        maxTokens: document.getElementById("maxTokens"),
        temperature: document.getElementById("temperature")
      };
      let history = [];
      let sortDirection = 1;

      function setActiveTab(tabButton, section) {
        [chatTab, benchmarkTab, marketplaceTab, configTab].forEach((b) => b.classList.remove("active"));
        [chatSection, benchmarkSection, marketplaceSection, configSection].forEach((s) => s.classList.remove("active"));
        tabButton.classList.add("active");
        section.classList.add("active");
      }

      chatTab.addEventListener("click", () => setActiveTab(chatTab, chatSection));
      benchmarkTab.addEventListener("click", () => setActiveTab(benchmarkTab, benchmarkSection));
      marketplaceTab.addEventListener("click", () => setActiveTab(marketplaceTab, marketplaceSection));
      configTab.addEventListener("click", () => setActiveTab(configTab, configSection));

      document.querySelectorAll(".tool-button").forEach((button) => {
        button.addEventListener("click", () => {
          const command = button.getAttribute("data-command");
          if (command) {
            vscode.postMessage({ type: "agentCommand", payload: { command } });
          }
        });
      });

      if (saveConfig) {
        saveConfig.addEventListener("click", () => {
          vscode.postMessage({
            type: "saveConfig",
            payload: {
              enabled: Boolean(configFields.enabled.checked),
              mode: configFields.mode.value,
              localModelUrl: configFields.localModelUrl.value,
              localModelName: configFields.localModelName.value,
              localMaxTokens: Number(configFields.localMaxTokens.value),
              localTemperature: Number(configFields.localTemperature.value),
              remoteProvider: configFields.remoteProvider.value,
              remoteApiKey: configFields.remoteApiKey.value,
              remoteModelName: configFields.remoteModelName.value,
              remoteMaxTokens: Number(configFields.remoteMaxTokens.value),
              remoteTemperature: Number(configFields.remoteTemperature.value),
              contextLength: Number(configFields.contextLength.value),
              loopTaskCount: Number(configFields.loopTaskCount.value),
              enableMarketplace: Boolean(configFields.enableMarketplace.checked),
              marketplaceUrl: configFields.marketplaceUrl.value,
              maxTokens: Number(configFields.maxTokens.value),
              temperature: Number(configFields.temperature.value)
            }
          });
        });
      }

      sendChat.addEventListener("click", () => {
        const text = chatInput.value.trim();
        if (!text) {
          return;
        }
        history.push({ role: "user", content: text });
        renderChat();
        chatInput.value = "";
        vscode.postMessage({ type: "sendChat", payload: { prompt: text } });
      });

      chatInput.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          sendChat.click();
          event.preventDefault();
        }
      });

      function escapeHtml(value) {
        if (value === null || value === undefined) {
          return "";
        }
        return String(value)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function renderChat() {
        if (!chatHistory) {
          return;
        }
        chatHistory.innerHTML = history
          .map((item) =>
            '<div class="message ' + escapeHtml(item.role) + '">' +
            '<div class="bubble">' + escapeHtml(item.content) + '</div>' +
            '</div>'
          )
          .join("");
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }

      function renderBenchmark(results, title) {
        if (!benchmarkBody) {
          return;
        }
        if (!Array.isArray(results) || results.length === 0) {
          benchmarkBody.innerHTML = "<tr><td colspan='6'>No benchmark results available.</td></tr>";
          if (benchmarkDetails) {
            benchmarkDetails.textContent = title || "No data available.";
          }
          return;
        }

        benchmarkBody.innerHTML = results
          .map((r) =>
            '<tr>' +
            '<td>' + escapeHtml(r.provider) + '</td>' +
            '<td>' + escapeHtml(r.model) + '</td>' +
            '<td>' + escapeHtml(String(r.metrics.latencyMs)) + '</td>' +
            '<td>' + escapeHtml(String(r.metrics.inputTokens)) + '</td>' +
            '<td>' + escapeHtml(String(r.metrics.outputTokens)) + '</td>' +
            '<td>' + escapeHtml(String(r.metrics.tokensPerSecond)) + '</td>' +
            '</tr>'
          )
          .join("");
        if (benchmarkDetails) {
          benchmarkDetails.textContent = title;
        }
      }

      function renderMarketplace(skills, title) {
        if (!marketplaceCards) {
          return;
        }
        marketplaceCards.innerHTML = skills
          .map((skill) =>
            '<div class="skill-card">' +
            '<div class="skill-header"><strong>' + escapeHtml(skill.name) + '</strong> <span class="skill-version">' + escapeHtml(skill.version) + '</span></div>' +
            '<div class="skill-description">' + escapeHtml(skill.description) + '</div>' +
            '<div class="skill-meta">' + escapeHtml(skill.category) + ' • ' + escapeHtml(skill.author) + ' • ' + (skill.supportedByMcp ? 'MCP' : 'Standard') + '</div>' +
            '<div class="skill-tags">' + skill.tags.map((tag) => '<span class="skill-tag">' + escapeHtml(tag) + '</span>').join(' ') + '</div>' +
            '<button class="installSkill" data-skill-id="' + escapeHtml(skill.id) + '">' + (skill.installed ? 'Installed' : 'Install') + '</button>' +
            '</div>'
          )
          .join("");
        if (benchmarkDetails) {
          benchmarkDetails.textContent = title;
        }
        document.querySelectorAll(".installSkill").forEach((button) => {
          button.addEventListener("click", () => {
            const skillId = button.getAttribute("data-skill-id");
            if (skillId) {
              vscode.postMessage({ type: "installSkill", payload: { skillId } });
            }
          });
        });
      }

      function sortTable(colIndex) {
        if (!benchmarkBody) {
          return;
        }
        const rows = Array.from(benchmarkBody.querySelectorAll("tr"));
        rows.sort((a, b) => {
          const va = a.children[colIndex]?.textContent || "";
          const vb = b.children[colIndex]?.textContent || "";
          const numA = Number(va);
          const numB = Number(vb);
          if (!isNaN(numA) && !isNaN(numB)) {
            return (numA - numB) * sortDirection;
          }
          return va.localeCompare(vb) * sortDirection;
        });
        benchmarkBody.innerHTML = "";
        rows.forEach((row) => benchmarkBody.appendChild(row));
        sortDirection = -sortDirection;
      }

      document.querySelectorAll(".benchmark-table th").forEach((th) => {
        th.addEventListener("click", () => sortTable(Number(th.dataset.col)));
      });

      window.addEventListener("message", (event) => {
        const message = event.data;
        const analysisSection = document.getElementById("analysisSection");

        if (message.type === "chat") {
          history = message.payload.history || history;
          renderChat();
          if (analysisSection) {
            analysisSection.textContent = message.payload.analysis || "No analysis available.";
          }
          if (benchmarkDetails) {
            benchmarkDetails.textContent = message.payload.status || "Chat updated.";
          }
          setActiveTab(chatTab, chatSection);
        }
        if (message.type === "benchmark") {
          renderBenchmark(message.payload.results || [], message.payload.title || "Benchmark results");
          setActiveTab(benchmarkTab, benchmarkSection);
        }
        if (message.type === "toolsResult") {
          if (toolsOutput) {
            toolsOutput.textContent = message.payload.result || "No result available.";
          }
          setActiveTab(benchmarkTab, benchmarkSection);
        }
        if (message.type === "config") {
          const config = message.payload || {};
          Object.entries(config).forEach(([key, value]) => {
            const field = configFields[key];
            if (!field) {
              return;
            }
            if (field.type === "checkbox") {
              field.checked = Boolean(value);
            } else {
              field.value = value ?? "";
            }
          });
        }
        if (message.type === "marketplace") {
          renderMarketplace(message.payload.skills || [], message.payload.title || "Marketplace");
          setActiveTab(marketplaceTab, marketplaceSection);
        }
      });

      vscode.postMessage({ type: "ready" });
    </script>
  </body>
</html>`;
  }
}

export function renderConfigUI(panel: vscode.WebviewPanel, config: AIConfig): void {
  const nonce = getNonce();
  try {
    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src 'self' data: https:;" />
    <title>Imrabo Configuration</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        padding: 16px;
        font-family: "Segoe UI", sans-serif;
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
      }
      .card {
        background: var(--vscode-panel-background);
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 10px;
        padding: 14px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.06);
      }
      label {
        display: block;
        margin-top: 12px;
        margin-bottom: 4px;
        font-size: 12px;
        color: var(--vscode-descriptionForeground);
      }
      input, select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--vscode-input-border);
        border-radius: 6px;
        padding: 10px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
      }
      .row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      button {
        margin-top: 16px;
        border: none;
        border-radius: 6px;
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        font-weight: 600;
        padding: 10px 16px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h3>Imrabo Settings</h3>
      <div class="row">
        <input type="checkbox" id="enabled" ${config.enabled ? "checked" : ""} style="width:auto" />
        <label for="enabled" style="margin:0">Enable Imrabo</label>
      </div>

      <label for="mode">Execution Mode</label>
      <select id="mode">
        <option value="local" ${config.mode === "local" ? "selected" : ""}>Local only</option>
        <option value="remote" ${config.mode === "remote" ? "selected" : ""}>Remote only</option>
        <option value="hybrid" ${config.mode === "hybrid" ? "selected" : ""}>Hybrid</option>
      </select>

      <h4>Local Model Configuration</h4>
      <label for="localModelUrl">Local Model URL</label>
      <input id="localModelUrl" value="${escapeHtml(config.localModelUrl)}" placeholder="http://localhost:11434" />

      <label for="localModelName">Local Model Name</label>
      <input id="localModelName" value="${escapeHtml(config.localModelName)}" placeholder="e.g. llama3" />

      <label for="localMaxTokens">Local Max Tokens</label>
      <input id="localMaxTokens" type="number" min="1" value="${config.localMaxTokens}" />

      <label for="localTemperature">Local Temperature</label>
      <input id="localTemperature" type="number" min="0" max="1" step="0.1" value="${config.localTemperature}" />

      <h4>Remote Model Configuration</h4>
      <label for="remoteApiKey">Remote API Key</label>
      <input id="remoteApiKey" value="${escapeHtml(config.remoteApiKey)}" type="password" />

      <label for="remoteProvider">Remote Provider</label>
      <select id="remoteProvider">
        <option value="openai" ${config.remoteProvider === "openai" ? "selected" : ""}>OpenAI</option>
        <option value="anthropic" ${config.remoteProvider === "anthropic" ? "selected" : ""}>Anthropic</option>
        <option value="custom" ${config.remoteProvider === "custom" ? "selected" : ""}>Custom</option>
      </select>

      <label for="remoteModelName">Remote Model Name</label>
      <input id="remoteModelName" value="${escapeHtml(config.remoteModelName)}" placeholder="e.g. gpt-4o" />

      <label for="remoteMaxTokens">Remote Max Tokens</label>
      <input id="remoteMaxTokens" type="number" min="1" value="${config.remoteMaxTokens}" />

      <label for="remoteTemperature">Remote Temperature</label>
      <input id="remoteTemperature" type="number" min="0" max="1" step="0.1" value="${config.remoteTemperature}" />

      <label for="contextLength">Context Length</label>
      <input id="contextLength" type="number" min="1" value="${config.contextLength}" />

      <h4>Looping Task Settings</h4>
      <label for="loopTaskCount">Default Loop Count</label>
      <input id="loopTaskCount" type="number" min="1" value="${config.loopTaskCount}" />

      <h4>Generic Settings</h4>
      <label for="maxTokens">Max Tokens</label>
      <input id="maxTokens" type="number" min="1" value="${config.maxTokens}" />

      <label for="temperature">Temperature</label>
      <input id="temperature" type="number" min="0" max="1" step="0.1" value="${config.temperature}" />

      <button id="saveBtn">Save Settings</button>
    </div>

    <script nonce="${nonce}">
      const vscode = acquireVsCodeApi();
      document.getElementById("saveBtn").addEventListener("click", () => {
        vscode.postMessage({
          type: "saveConfig",
          payload: {
            enabled: document.getElementById("enabled").checked,
            mode: document.getElementById("mode").value,
            localModelUrl: document.getElementById("localModelUrl").value,
            localModelName: document.getElementById("localModelName").value,
            localMaxTokens: Number(document.getElementById("localMaxTokens").value),
            localTemperature: Number(document.getElementById("localTemperature").value),
            remoteApiKey: document.getElementById("remoteApiKey").value,
            remoteProvider: document.getElementById("remoteProvider").value,
            remoteModelName: document.getElementById("remoteModelName").value,
            remoteMaxTokens: Number(document.getElementById("remoteMaxTokens").value),
            remoteTemperature: Number(document.getElementById("remoteTemperature").value),
            contextLength: Number(document.getElementById("contextLength").value),
            loopTaskCount: Number(document.getElementById("loopTaskCount").value),
            maxTokens: Number(document.getElementById("maxTokens").value),
            temperature: Number(document.getElementById("temperature").value)
          }
        });
      });
    </script>
  </body>
</html>`;
  } catch (error) {
    // Safely ignore if webview is disposed
  }
}
