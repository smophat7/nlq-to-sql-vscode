import * as constants from "./constants";
import * as vscode from "vscode";

/**
 * Controls access to the extension's settings in VS Code.
 */
export class SettingsManager {
  private static config = vscode.workspace.getConfiguration(
    constants.EXTENSION_ID
  );

  /**
   * @returns The API key to use with the OpenAI API model.
   */
  public static getApiKey(): string {
    const apiKey = this.config.get("apiKey");
    if (!apiKey) {
      vscode.window.showErrorMessage(
        `${constants.EXTENSION_NAME}: API key not set.`
      );
    }
    return apiKey as string;
  }

  /**
   * @returns The ID of the OpenAI API model.
   */
  public static getModelId(): string {
    const modelId = this.config.get("modelId");
    if (!modelId) {
      vscode.window.showErrorMessage(
        `${constants.EXTENSION_NAME}: API Model ID not set.`
      );
    }
    return modelId as string;
  }

  /**
   * @returns Directory names to exclude from searches for database files.
   */
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
