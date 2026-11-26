# Project Guide: ImRabo VS Code Extension

This guide provides an overview of the architecture, development workflow, and key concepts for the ImRabo VS Code Extension project.

## 1. Project Overview

**Purpose:**
The project is a VS Code extension designed to integrate advanced agent-based functionalities (planning, execution, tool use) into the IDE environment, likely powered by an AI/LLM system. It seems to manage workflow execution, context indexing, and interaction with external tools or services.

**Key Technologies Used:**

* **Language:** TypeScript
* **Framework/Platform:** VS Code Extension API (implied by `apps/vscode` directory)
* **Architecture:** Modular design utilizing several internal packages (`kernel`, `providers`, `runtime`) for separation of concerns.
* **Agent System:** Custom implementation involving agents, planners, and executors.

**High-level Architecture:**
The architecture is highly modular, separating core logic into distinct packages:

* **Kernel:** Manages core services like configuration management, dependency injection, event bus, and logging (`src/kernel`).
* **Runtime:** Handles execution flow, scheduling, and tool interaction (`src/runtime`).
* **Providers:** Abstracts external services (e.g., LM Studio, Ollama) (`src/providers`).
* **Agent System:** Orchestrates the AI workflow using agents for planning, reviewing, and execution (`src/agent-system`).

## 2. Getting Started

**Prerequisites:**

* Node.js (LTS version)
* npm or yarn
* VS Code

**Installation Instructions:**

1. Clone the repository: `git clone <repository-url>`
2. Navigate to the project directory: `cd <repository-name>`
3. Install dependencies: `npm install` (or `yarn install`)
4. (If building for VS Code extension) Follow platform-specific instructions in the `docs/getting-started` directory.

**Basic Usage Examples:**

* To run tests: `npm test`
* To explore documentation: Check the `docs/` directory for guides on setup and usage.

**Running Tests:**
Tests are located within the `packages/*/tests/` directories, ensuring that logic in each core package is verified independently.

## 3. Project Structure

The project is organized into several key areas:

* **`src/`**: Contains the main application source code, heavily structured around functional modules.
  * `src/kernel/`: Core services and abstractions (ConfigManager, DependencyInjector, EventBus).
  * `src/runtime/`: Execution logic (Executor, SchedulerCore).
  * `src/providers/`: Implementations for external integrations (LMStudio, Ollama).
  * `src/agent-system/`: Agent orchestration logic (AgentManager, Planner, Reviewer).
  * `src/tools/`: Interfaces and runtime components for tool usage.
* **`apps/vscode/`**: Contains the actual VS Code extension code. This includes activation scripts, commands, panels, and webviews that expose the backend logic to the IDE UI.
* **`packages/`**: Houses reusable, decoupled libraries:
  * `packages/kernel/`: Core kernel logic.
  * `packages/providers/`: Implementations for external service providers.
  * `packages/runtime/`: Runtime execution logic.
  * `packages/shared/`: Shared utilities and architectural definitions (e.g., `ARCHITECTURE.md`, `CHANGELOG.md`).
* **`docs/`**: Contains all project documentation, guides, architecture diagrams, and roadmap information.

## 4. Development Workflow

**Coding Standards & Conventions:**

* Code adheres to TypeScript conventions.
* Modularity is enforced via the package structure (`kernel`, `providers`, `runtime`).
* Interfaces are defined clearly across packages (e.g., `src/tools/interfaces.ts`, `src/providers/interfaces.ts`).

**Testing Approach:**

* Unit tests exist for core logic within each package (`packages/*/tests/`).
* Integration testing should focus on the interaction between runtime, kernel, and provider layers.

**Build and Deployment Process:**

* Build process is managed via `package.json` scripts (e.g., `npm run build`).
* Deployment for VS Code extension involves building the extension package and loading it in VS Code (details are in `docs/getting-started`).

**Contribution Guidelines:**

1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/my-new-feature`).
3. Make your changes.
4. Commit your changes (`git commit -m 'feat: description'`).
5. Open a Pull Request against `main`.

## 5. Key Concepts

**Domain-specific Terminology:**

* **Agent:** An autonomous entity capable of planning, reasoning, and taking actions based on a goal.
* **Planner/Reviewer:** Components responsible for formulating steps and critically assessing outcomes, respectively.
* **Executor:** The component that actually runs the determined plan or action.
* **Kernel:** The centralized system managing dependencies, configuration, and communication (EventBus).
* **Provider:** An interface layer that abstracts access to external services (e.g., LLMs via LM Studio/Ollama).

**Core Abstractions & Design Patterns:**

* **Dependency Injection:** Used heavily in the `kernel` package (`src/kernel/DependencyInjector.ts`) to manage service dependencies cleanly.
* **Event-Driven Architecture:** Communication flows through an internal Event Bus (`src/kernel/EventBus.ts`).
* **Interface Segregation:** Clear separation between runtime logic, provider implementations, and core kernel services.

## 6. Common Tasks

**Setting up a New Provider:**

1. Create a new file in `packages/providers/` (e.g., `new-provider.ts`).
2. Define the required interface in `packages/providers/interfaces.ts`.
3. Implement the provider logic, ensuring it adheres to the shared interfaces and communicates via the kernel events if necessary.

**Creating a New Tool:**

1. Define the tool structure in `src/tools/interfaces.ts`.
2. Register the tool definition in `src/tools/tool_registry.ts`.
3. Implement the actual execution logic, likely within a specific provider or runtime module.

**Running an Agent Workflow:**

1. Define the goal and initial context in the workspace context.
2. Use the `AgentManager` (`src/agent-system/AgentManager.ts`) to initiate planning.
3. The system uses the `SchedulerCore` (`src/scheduler/SchedulerCore.ts`) to execute the plan steps via the `Executor`.

## 7. Troubleshooting

**Common Issues and Solutions:**

* **Dependency Injection Errors:** If services fail to inject correctly, check the configuration in `packages/kernel/ConfigManager.ts` or ensure all required interfaces are implemented by their concrete classes.
* **Provider Connection Failures:** Check environment variables (e.g., for API keys) and verify that the provider implementation (`src/providers/*.ts`) is correctly initialized and handles errors gracefully, especially when interacting with external services like Ollama or LM Studio.
* **Workflow Stalling:** Investigate the `SchedulerCore` and the `Executor`. Check if necessary events are being emitted on the `EventBus` to trigger the next step in the workflow.

**Debugging Tips:**

* Use `console.log` strategically within the `src/runtime` and `src/agent-system` layers to trace execution flow.
* Examine logs generated by `src/kernel/Logger.ts`.

## 8. References

* **Architecture Deep Dive:** `packages/*/ARCHITECTURE.md` (Review files in `packages/`, e.g., `packages/kernel/ARCHITECTURE.md`).
* **API Definitions:** `packages/*/PUBLIC_API.md` (e.g., `packages/providers/PUBLIC_API.md`).
* **Contribution Guide:** `README.md` and `roadmap.md`.
* **VS Code Extension Setup:** `docs/getting-started/`.

---
*Note: This guide is based on the current file structure. Please review and edit it as needed.*

You have successfully created the comprehensive project guide, **CONTINUE.md**.

**Next Steps:**

1. **Review and Edit:** Please review the generated file (`.continue/rules/CONTINUE.md`) and make any necessary adjustments to reflect the very latest changes or specific team conventions.
2. **Commit:** Commit this file to your repository to share it with your team.
3. **Context Loading:** Continue will automatically load this file into context when working with the project, making this documentation available for all future interactions.
4. **Further Documentation:** Feel free to create additional `rules.md` files in subdirectories (e.g., `docs/agents/rules.md`) for more specific documentation related to those components.
