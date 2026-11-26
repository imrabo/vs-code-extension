import { ITool } from './interfaces';

export class ToolRegistry {
    private tools: Map<string, ITool> = new Map();

    registerTool(tool: ITool): void {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool with name '${tool.name}' is already registered.`);
        }
        this.tools.set(tool.name, tool);
        console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
    }

    getTool(toolName: string): ITool | undefined {
        return this.tools.get(toolName);
    }

    getAllTools(): ITool[] {
        return Array.from(this.tools.values());
    }
}