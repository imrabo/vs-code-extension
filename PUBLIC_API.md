# PUBLIC API

This file defines the public interface for the Imrabo VS Code Extension. It specifies all accessible commands, configuration points, and external services exposed to the user and the extension itself.

## Commands

The following commands are exposed via `vscode.commands.registerCommand`:

* `imrabo.runLocalModel`: Executes a local model task.
* `imrabo.runRemoteModel`: Executes a remote model task.
* `imrabo.generateCode`: Generates code based on prompts.
* `imrabo.analyzeText`: Analyzes selected text.
* `imrabo.explainCode`: Explains selected code.
* `imrabo.fixCode`: Suggests code fixes.
* `imrabo.createTests`: Creates tests for the context.
* `imrabo.summarizeFile`: Summarizes a file's content.
* `imrabo.configureModels`: Configures the underlying language models.
* `imrabo.benchmarkPrompt`: Benchmarks prompt performance.
* `imrabo.openChat`: Opens an interactive chat interface.
* `imrabo.openMarketplace`: Opens the marketplace for extensions/tools.
* `imrabo.loopTask`: Runs a continuous loop task.

## Configuration

The extension reads configuration from `config.ts`. All settings are managed through this central source to ensure consistency and validation.

## Providers

The system supports pluggable model providers, including:

* LM Studio (Local Model)
* Ollama (Future Remote Support)
* OpenAI-compatible APIs

## Webview Interface

A custom webview view is provided by `ImraboPanelViewProvider` for user interaction.
