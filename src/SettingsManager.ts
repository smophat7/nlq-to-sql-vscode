import * as constants from "./constants";
import * as vscode from "vscode";

/**
 * Controls access to the extension's settings in VS Code.
 * Uses the extension's VS Code configuration and the extension's global state.
 */
export class SettingsManager {
  private static extensionGlobalState: vscode.Memento;
  private static readonly openaiApiKeyKey = "openaiApiKey";
  private static readonly modelId = "modelId";
  private static readonly maxTokens = "maxTokens";
  private static readonly temperature = "temperature";

  public static initialize(context: vscode.ExtensionContext) {
    SettingsManager.extensionGlobalState = context.globalState;
  }

  /**
   * @returns The extension's VS Code configuration.
   */
  private static get config() {
    return vscode.workspace.getConfiguration(constants.EXTENSION_ID);
  }

  /**
   * Gets the OpenAI API key from the extension's global state.
   * If not set, prompts the user to enter it.
   * Returns undefined if the API key is still not set.
   */
  public static async getOpenAIApiKey(): Promise<string | undefined> {
    let apiKey = this.extensionGlobalState.get(this.openaiApiKeyKey);

    if (!apiKey) {
      await vscode.commands.executeCommand("nlq-to-sql.setApiKey");
    }

    apiKey = this.extensionGlobalState.get(this.openaiApiKeyKey);
    if (!apiKey) {
      vscode.window.showErrorMessage("API key not set.");
      return;
    }

    return apiKey as string;
  }

  /*
   * Sets the OpenAI API key in the extension's global state.
   */
  public static setOpenAIApiKey(apiKey: string) {
    this.extensionGlobalState.update(this.openaiApiKeyKey, apiKey);
  }

  /**
   * @returns The ID of the OpenAI API model.
   */
  public static getModelId(): string | undefined {
    const modelId = this.config.get(this.modelId);
    if (!modelId) {
      vscode.window.showErrorMessage("API Model ID not set.");
      return undefined;
    }
    return modelId as string;
  }

  /**
   * @returns The maximum number of tokens to generate in a single completion from the OpenAI API. Null if not set, which uses the OpenAI default.
   */
  public static getMaxTokens(): number | null {
    return this.config.get(this.maxTokens) ?? null;
  }

  /**
   * @returns The temperature to use when sampling from the OpenAI API. Null if not set, which uses the OpenAI default.
   */
  public static getTemperature(): number | null {
    return this.config.get(this.temperature) ?? null;
  }
}
