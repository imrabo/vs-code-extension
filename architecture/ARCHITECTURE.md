# Architecture

This document outlines the intended modular architecture for the Imrabo VS Code Extension, aiming for a clean, maintainable, and documentation-first design that supports future evolution into Imrabo AgentOS.

## Core Principles

The architecture adheres to the following principles:

1. **Separation of Concerns:** Business logic must be kept independent of VS Code APIs.
2. **Modularity:** Modules should own their concerns and be independently valuable.
3. **Composition over Inheritance:** Favor composition for building complex functionality.
4. **Documentation First:** Every module must have synchronized, up-to-date documentation.

## Proposed Module Structure (Target Direction)

The project will evolve towards the following high-level modules:

* **VS Code Application Layer:** Handles VS Code API interactions and command registration.
* **Kernel:** Manages core state, dependencies, and event handling.
* **Runtime:** Executes agent tasks, prompt loading, and structured output generation.
* **Providers:** Abstract interfaces for external services (e.g., LM Studio, Ollama).
* **Shared Utilities:** Common functions, configuration access, and cross-cutting concerns.

## Current State Assessment

The current structure is functional but tightly coupled. Refactoring will focus on gradually moving responsibilities into these higher-level modules without rewriting existing functional code immediately.

## Future Evolution Roadmap (Future Requirements)

This architecture is designed to support future expansion in the following areas:

* Scheduler and Workflow Engine
* Context Engine and Memory Management
* Review Pipeline
* Plugin SDK
