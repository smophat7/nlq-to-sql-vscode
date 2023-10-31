import * as vscode from "vscode";

import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { TableContextTreeItem } from "../treeView/DatabaseTreeViewItem";

/**
 * Changes the active table context and, if necessary, the active database.
 *
 * @param tableContextTreeItem
 * @param databaseInfoManager
 */
export async function selectTableContext(
  tableContextTreeItem: TableContextTreeItem,
  databaseInfoManager: DatabaseInfoManager
): Promise<void> {
  const tableContextId = tableContextTreeItem.databaseItemId;
  if (!tableContextId) {
    vscode.window.showErrorMessage("Could not find table context to select");
    return;
  }

  const databaseId =
    databaseInfoManager.getDatabaseIdByTableContextId(tableContextId);
  if (!databaseId) {
    vscode.window.showErrorMessage(
      "Could not find database associated with table context"
    );
    return;
  }

  try {
    await databaseInfoManager.setActiveTableContextAndDatabase(
      tableContextId,
      databaseId
    );
    vscode.window.showInformationMessage(
      `Selected table context ${tableContextTreeItem.label} and database ${databaseId}`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to select table context: ${error}`);
    return;
  }

  vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
  vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableContext");
}
