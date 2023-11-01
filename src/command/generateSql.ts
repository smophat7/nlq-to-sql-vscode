import * as vscode from "vscode";
import OpenAI from "openai";
import { SettingsManager } from "../SettingsManager";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";

/**
 * Generates an SQL query from the user's natural language query, inserting it into the active editor
 * (opening a new editor and blank document if there is no active editor).
 *
 * @param databaseInfoManager
 * @returns
 */
export async function generateSql(databaseInfoManager: DatabaseInfoManager) {
  const naturalLanguageQuery = await getUserQuery();
  if (!naturalLanguageQuery) {
    vscode.window.showErrorMessage("Query cannot be empty.");
    return;
  }

  let schema: string;
  try {
    schema = databaseInfoManager.getActiveGroupSchema();
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to retrieve the schema of the active table context: ${error}`
    );
    return;
  }

  let sql: string | undefined;
  vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Generating SQL...",
      cancellable: false,
    },
    async () => {
      try {
        sql = await requestLlmConversion(schema, naturalLanguageQuery);
        if (!sql) {
          vscode.window.showErrorMessage("Failed to generate SQL.");
          return;
        }

        let editor = vscode.window.activeTextEditor;
        if (!editor) {
          const blankUntitledDocument =
            await vscode.workspace.openTextDocument();
          editor = await vscode.window.showTextDocument(blankUntitledDocument, {
            viewColumn: vscode.ViewColumn.Beside,
          });
        }
        insertSqlIntoEditor(editor, sql);
      } catch (error) {
        vscode.window.showErrorMessage(`Error generating SQL: ${error}`);
      }
    }
  );
}

/**
 * Requests an SQL query from the OpenAI API using the given natural language.
 * TODO: Refactor to use a separate class for LLM API requests.
 *
 * @param schema The schema of the active table context.
 * @param query The natural language query to convert to SQL.
 * @returns The generated SQL query or undefined if the request failed or the response was undefined.
 */
async function requestLlmConversion(
  schema: string,
  query: string
): Promise<string | undefined> {
  const openai = new OpenAI({
    apiKey: SettingsManager.getApiKey(),
  });
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `Your task is to convert a natural language question into an SQL query for the given database. Note the following:
          - Use only sqlite3 syntax and features.
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
    model: SettingsManager.getModelId(),
  });
  return chatCompletion.choices[0].message.content?.trim(); // TODO: Error handling
}

/**
 * Inserts the given SQL into the given editor.
 *
 * @param editor
 * @param sql
 */
function insertSqlIntoEditor(editor: vscode.TextEditor, sql: string) {
  editor.edit((editBuilder) => {
    editBuilder.insert(editor.selection.active, sql);
  });
}

/**
 * Asks the user to enter a natural language query.
 *
 * @returns The user's natural language query.
 */
async function getUserQuery(): Promise<string | undefined> {
  const userInput = await vscode.window.showInputBox({
    prompt: "Enter a natural language query for which to generate SQL.",
    validateInput: (text) => {
      if (!text) {
        return "Query cannot be empty.";
      }
      return null;
    },
  });
  return userInput;
}
