import * as constants from "./constants";
import * as vscode from "vscode";

export class SettingsProvider {
  private static config = vscode.workspace.getConfiguration(
    constants.EXTENSION_ID
  );

  public static getApiKey(): string {
    const apiKey = this.config.get("apiKey");
    if (!apiKey) {
      vscode.window.showErrorMessage("TODO: Error message - API key not set.");
    }
    return apiKey as string;
  }

  public static getModelId(): string {
    const modelId = this.config.get("modelId");
    if (!modelId) {
      vscode.window.showErrorMessage("TODO: Error message - model ID not set.");
    }
    return modelId as string;
  }
}
