import * as vscode from "vscode";

export class Logger {
  private static channel: vscode.OutputChannel | undefined;

  public static initialize(): void {
    if (!Logger.channel) {
      Logger.channel = vscode.window.createOutputChannel("Imrabo AI");
    }
  }

  public static log(message: string, level: "INFO" | "WARN" | "ERROR" = "INFO"): void {
    if (!Logger.channel) {
      Logger.initialize();
    }
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level}] ${message}`;
    Logger.channel?.appendLine(formattedMessage);
  }

  public static info(message: string): void {
    Logger.log(message, "INFO");
  }

  public static warn(message: string): void {
    Logger.log(message, "WARN");
  }

  public static error(message: string, error?: any): void {
    let msg = message;
    if (error) {
      msg += ` - Error: ${error instanceof Error ? error.stack || error.message : String(error)}`;
    }
    Logger.log(msg, "ERROR");
  }

  public static show(): void {
    Logger.channel?.show();
  }
}
