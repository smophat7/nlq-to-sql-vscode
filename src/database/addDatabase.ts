import * as vscode from "vscode";
import { DatabaseInfoManager } from "./DatabaseInfoManager";
import { TableInfo } from "./DatabaseInfo";
import { convertCreateStatementsToTableInfo } from "./convertCreateStatementsToTableInfo";

/**
 * Parses the create statements for the database, converts them to table info,
 * then adds the database to the workspace state, sets it as the active database, and refreshes the database explorer.
 *
 * @param databaseInfoManager
 * @param databaseName Name of the database.
 * @param sqlDialect Dialect of the database.
 * @param createTableStatements Create statements for the database (expected to be separated by `;`).
 * @returns True if the database was added successfully, false otherwise.
 */
export async function addDatabase(
  databaseInfoManager: DatabaseInfoManager,
  databaseName: string,
  sqlDialect: string,
  createTableStatements: string
): Promise<boolean> {
  let tableInfos: TableInfo[];
  try {
    tableInfos = convertCreateStatementsToTableInfo(createTableStatements);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Could not convert create statements to table info: ${error}`
    );
    return false;
  }

  const ifAdded: boolean = await databaseInfoManager.addDatabase(
    databaseName,
    sqlDialect,
    tableInfos
  );
  if (ifAdded) {
    vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
    vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableContext");
  }
  return ifAdded;
}
