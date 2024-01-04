import * as vscode from "vscode";
import { SettingsManager } from "../SettingsManager";

/**
 * Prompts the user to enter their OpenAI API key and saves it.
 */
export async function setApiKey(): Promise<void> {
  const value = await vscode.window.showInputBox({
    prompt: "Enter your OpenAI API key",
  });

  if (value) {
    SettingsManager.setOpenAIApiKey(value);
  }
}
