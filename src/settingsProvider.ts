import * as constants from "./constants";
import * as vscode from "vscode";

export class SettingsProvider {
  private static config = vscode.workspace.getConfiguration(
    constants.EXTENSION_ID
  );

  public static getApiKey(): string {
    const apiKey = this.config.get("apiKey");
    if (!apiKey) {
      vscode.window.showErrorMessage(
        `${constants.EXTENSION_NAME}: API key not set.`
      );
    }
    return apiKey as string;
  }

  public static getModelId(): string {
    const modelId = this.config.get("modelId");
    if (!modelId) {
      vscode.window.showErrorMessage(
        `${constants.EXTENSION_NAME}: API Model ID not set.`
      );
    }
    return modelId as string;
  }

  public static getExcludedDirectories(): string[] {
    const excludedDirectories = this.config.get("excludedDirectories");
    if (!excludedDirectories) {
      vscode.window.showErrorMessage(
        `${constants.EXTENSION_NAME}: No excluded directories set.`
      );
    }
    return excludedDirectories as string[];
  }
}
