import * as vscode from "vscode";
import OpenAI from "openai";
import { SettingsProvider } from "../settingsProvider";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";

// TODO: Document
export async function generateSql(databaseInfoManager: DatabaseInfoManager) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const query = await getUserQuery();
  if (!query) {
    vscode.window.showErrorMessage("Error: Query cannot be empty.");
    return;
  }

  let schema: string;
  try {
    schema = databaseInfoManager.getActiveGroupSchema();
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error retrieving the schema of the active table group: ${error}`
    );
    return;
  }

  try {
    const openai = new OpenAI({
      // TODO: Refactor to use dedicated API class thing
      apiKey: SettingsProvider.getApiKey(),
    });
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Your task is to convert a natural language question into an SQL query for the given database. Note the following:
          - Use sqlite3 syntax and features.
          - Use a single SELECT statement.
          - Use indentation to make the output easier to read.
          - For the columns, use aliases (<col> "AS" <name>) with proper capitalization to make the output easier to read.
          - If a relative date is used, use the calculated current date as the reference date.
          - Avoid making assumptions about the current state of the database (e.g. do not assume that the database is empty).`,
        },
        {
          role: "system",
          content: `All the CREATE statements for the given database: ${schema}`,
        },
        {
          role: "user",
          content: `Natural language question to convert to SQL: ${query}`,
        },
      ],
      model: SettingsProvider.getModelId(),
    });
    const sql = chatCompletion.choices[0].message.content?.trim(); // TODO: Error handling
    vscode.window.showInformationMessage(`Generated SQL: ${sql}`); // TODO: DELETE ME
  } catch (error) {
    vscode.window.showErrorMessage(`Error generating SQL: ${error}`); // TODO: handle better
  }
}

/**
 * Asks the user to enter a query.
 *
 * @returns The user's query.
 */
async function getUserQuery(): Promise<string | undefined> {
  const userInput = await vscode.window.showInputBox({
    validateInput: (text) => {
      if (!text) {
        return "Query cannot be empty.";
      }
      return null;
    },
  });
  return userInput;
}
