import { DatabaseContextProvider } from "./database/DatabaseContextProvider";
import { SqliteContextProvider } from "./database/SqliteContextProvider";
import { SelectedDatabase } from "./selectedDatabase";
import * as vscode from "vscode";

/**
 * Gets the database context provider. Prompts the user for the database path if it is not set.
 * Throws an error if the database path is still not set after prompting the user.
 *
 * @returns The database context provider, or null if the user wants no database context.
 */
export async function getDatabaseContextProvider(): Promise<DatabaseContextProvider | null> {
  if (SelectedDatabase.dbPath === undefined) {
    const newDbPath = await vscode.window.showInputBox({
      prompt: "Enter the path to the database file",
    });
    SelectedDatabase.dbPath = newDbPath;
  }

  if (SelectedDatabase.dbPath === undefined) {
    throw new Error("Database path not set.");
  }

  if (SelectedDatabase.dbPath === null) {
    return null;
  }

  return new SqliteContextProvider(SelectedDatabase.dbPath);
}
