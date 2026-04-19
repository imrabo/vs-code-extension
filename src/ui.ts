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

export interface ImraboPanelMessageHandler {
  (message: { type: string; payload?: any }): void;
}

export class ImraboPanelViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "imrabo.panel";

  private currentView: vscode.WebviewView | undefined;
  private messageHandler: ImraboPanelMessageHandler | undefined;

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.currentView = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this.buildPanelHtml();
    webviewView.webview.onDidReceiveMessage((message) => {
      this.messageHandler?.(message);
    });
  }

  registerMessageHandler(handler: ImraboPanelMessageHandler): void {
    this.messageHandler = handler;
  }

  showBenchmark(results: ModelResponse[], title: string): void {
    if (!this.currentView) {
      return;
    }
    this.currentView.webview.postMessage({ type: "benchmark", payload: { title, results } });
  }

  showChat(history: Array<{ role: string; content: string }>, status: string, analysis: string): void {
    if (!this.currentView) {
      return;
    }
    this.currentView.webview.postMessage({ type: "chat", payload: { history, status, analysis } });
  }

  private buildPanelHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Imrabo AI Assistant</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: "Segoe UI", sans-serif;
        color: var(--vscode-foreground);
        background-color: var(--vscode-editor-background);
      }
      .toolbar {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: var(--vscode-titleBar-activeBackground);
        border-bottom: 1px solid var(--vscode-editorWidget-border);
      }
      .toolbar button {
        border: 1px solid var(--vscode-input-border);
        background: var(--vscode-button-background);
        color: var(--vscode-button-foreground);
        border-radius: 5px;
        padding: 8px 12px;
        cursor: pointer;
      }
      .toolbar button.active {
        background: var(--vscode-button-hoverBackground);
      }
      .content {
        padding: 12px;
      }
      .panel {
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 10px;
        background: var(--vscode-panel-background);
        padding: 12px;
      }
      .section {
        display: none;
      }
      .section.active {
        display: block;
      }
      .chat-history {
        min-height: 280px;
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
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .input-row textarea {
        flex: 1;
        min-height: 80px;
        resize: vertical;
        padding: 10px;
        border: 1px solid var(--vscode-input-border);
        border-radius: 8px;
        background: var(--vscode-input-background);
        color: var(--vscode-input-foreground);
      }
      .input-row button {
        min-width: 100px;
      }
      .analysis-output {
        margin-top: 12px;
        padding: 12px;
        border: 1px solid var(--vscode-editorWidget-border);
        border-radius: 8px;
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
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button id="chatTab" class="active">Chat</button>
      <button id="benchmarkTab">Benchmarks</button>
      <button id="configTab">Config</button>
    </div>
    <div class="content">
      <div id="chatSection" class="section active panel">
        <div class="chat-history" id="chatHistory"></div>
        <div id="analysisSection" class="analysis-output">No analysis yet.</div>
        <div class="input-row">
          <textarea id="chatInput" placeholder="Ask the model anything..."></textarea>
          <button id="sendChat">Send</button>
        </div>
        <div class="hint">Chat using the configured local or remote model. Benchmarks update as messages are exchanged and analysis appears below responses.</div>
      </div>

      <div id="benchmarkSection" class="section panel">
        <div class="hint">Click column headers to sort benchmark results.</div>
        <table class="benchmark-table" id="benchmarkTable">
          <thead>
            <tr>
              <th data-col="0">Provider</th>
              <th data-col="1">Model</th>
              <th data-col="2">Latency (ms)</th>
              <th data-col="3">Input Tokens</th>
              <th data-col="4">Output Tokens</th>
              <th data-col="5">TPS</th>
            </tr>
          </thead>
          <tbody id="benchmarkBody">
            <tr><td colspan="6">No benchmark data available.</td></tr>
          </tbody>
        </table>
        <div id="benchmarkDetails" class="benchmark-output">Run a benchmark command or send a chat message to see metrics.</div>
      </div>

      <div id="configSection" class="section panel">
        <div class="hint">Use the configuration command to set model endpoints and names in the dedicated settings panel.</div>
      </div>
    </div>

    <script>
      const vscode = acquireVsCodeApi();
      const chatTab = document.getElementById("chatTab");
      const benchmarkTab = document.getElementById("benchmarkTab");
      const configTab = document.getElementById("configTab");
      const chatSection = document.getElementById("chatSection");
      const benchmarkSection = document.getElementById("benchmarkSection");
      const configSection = document.getElementById("configSection");
      const chatHistory = document.getElementById("chatHistory");
      const benchmarkBody = document.getElementById("benchmarkBody");
      const benchmarkDetails = document.getElementById("benchmarkDetails");
      const chatInput = document.getElementById("chatInput");
      const sendChat = document.getElementById("sendChat");
      let history = [];
      let sortDirection = 1;

      function setActiveTab(tabButton, section) {
        [chatTab, benchmarkTab, configTab].forEach((b) => b.classList.remove("active"));
        [chatSection, benchmarkSection, configSection].forEach((s) => s.classList.remove("active"));
        tabButton.classList.add("active");
        section.classList.add("active");
      }

      chatTab.addEventListener("click", () => setActiveTab(chatTab, chatSection));
      benchmarkTab.addEventListener("click", () => setActiveTab(benchmarkTab, benchmarkSection));
      configTab.addEventListener("click", () => setActiveTab(configTab, configSection));

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

      function renderChat() {
        chatHistory.innerHTML = history
          .map((item) =>
            '<div class="message ' + item.role + '">' +
            '<div class="bubble">' + item.content + '</div>' +
            '</div>'
          )
          .join("");
        chatHistory.scrollTop = chatHistory.scrollHeight;
      }

      function renderBenchmark(results, title) {
        if (!Array.isArray(results) || results.length === 0) {
          benchmarkBody.innerHTML = "<tr><td colspan='6'>No benchmark results available.</td></tr>";
          benchmarkDetails.textContent = title || "No data available.";
          return;
        }

        benchmarkBody.innerHTML = results
          .map((r) =>
            '<tr>' +
            '<td>' + r.provider + '</td>' +
            '<td>' + r.model + '</td>' +
            '<td>' + r.metrics.latencyMs + '</td>' +
            '<td>' + r.metrics.inputTokens + '</td>' +
            '<td>' + r.metrics.outputTokens + '</td>' +
            '<td>' + r.metrics.tokensPerSecond + '</td>' +
            '</tr>'
          )
          .join("");
        benchmarkDetails.textContent = title;
      }

      function sortTable(colIndex) {
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
          benchmarkDetails.textContent = message.payload.status || "Chat updated.";
          setActiveTab(chatTab, chatSection);
        }
        if (message.type === "benchmark") {
          renderBenchmark(message.payload.results || [], message.payload.title || "Benchmark results");
          setActiveTab(benchmarkTab, benchmarkSection);
        }
      });

      vscode.postMessage({ type: "ready" });
    </script>
  </body>
</html>`;
  }
}

export function renderConfigUI(panel: vscode.WebviewPanel, config: AIConfig): void {
  panel.webview.html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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

      <label for="remoteModelName">Remote Model Name</label>
      <input id="remoteModelName" value="${escapeHtml(config.remoteModelName)}" placeholder="e.g. gpt-4o" />

      <label for="remoteMaxTokens">Remote Max Tokens</label>
      <input id="remoteMaxTokens" type="number" min="1" value="${config.remoteMaxTokens}" />

      <label for="remoteTemperature">Remote Temperature</label>
      <input id="remoteTemperature" type="number" min="0" max="1" step="0.1" value="${config.remoteTemperature}" />

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

    <script>
      const vscode = acquireVsCodeApi();
      document.getElementById("saveBtn").addEventListener("click", () => {
        vscode.postMessage({
          type: "saveConfig",
          payload: {
            enabled: document.getElementById("enabled").checked,
            localModelUrl: document.getElementById("localModelUrl").value,
            localModelName: document.getElementById("localModelName").value,
            localMaxTokens: Number(document.getElementById("localMaxTokens").value),
            localTemperature: Number(document.getElementById("localTemperature").value),
            remoteApiKey: document.getElementById("remoteApiKey").value,
            remoteModelName: document.getElementById("remoteModelName").value,
            remoteMaxTokens: Number(document.getElementById("remoteMaxTokens").value),
            remoteTemperature: Number(document.getElementById("remoteTemperature").value),
            loopTaskCount: Number(document.getElementById("loopTaskCount").value),
            maxTokens: Number(document.getElementById("maxTokens").value),
            temperature: Number(document.getElementById("temperature").value)
          }
        });
      });
    </script>
  </body>
</html>`;
}
