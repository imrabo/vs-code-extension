export interface MarketplaceSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  version: string;
  author: string;
  supportedByMcp: boolean;
  tags: string[];
  installed: boolean;
}

export const skillsCatalog: MarketplaceSkill[] = [
  {
    id: "mcp-chat-enhancer",
    name: "MCP Chat Enhancer",
    description: "Adds advanced context-aware prompts and skill orchestration to the Imrabo chat flow.",
    category: "Chat",
    version: "1.0.0",
    author: "Imrabo Labs",
    supportedByMcp: true,
    tags: ["mcp", "chat", "skills"],
    installed: false
  },
  {
    id: "code-benchmark-skill",
    name: "Code Benchmark Skill",
    description: "Provides a reusable skill for automated code performance benchmarking.",
    category: "Benchmark",
    version: "0.9.1",
    author: "Imrabo Community",
    supportedByMcp: false,
    tags: ["benchmark", "analysis"],
    installed: false
  },
  {
    id: "local-model-adapter",
    name: "Local Model Adapter",
    description: "Integrates new local LLMs into Imrabo with model-specific configuration and prompt routing.",
    category: "Adapter",
    version: "1.2.0",
    author: "Imrabo Labs",
    supportedByMcp: true,
    tags: ["local", "adapter", "mcp"],
    installed: false
  }
];
