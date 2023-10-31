import * as vscode from "vscode";

import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { TableGroupTreeItem } from "../treeView/DatabaseTreeViewItem";

/**
 * Changes the active table group and, if necessary, the active database.
 *
 * @param tableGroupTreeItem
 * @param databaseInfoManager
 */
export async function selectTableGroup(
  tableGroupTreeItem: TableGroupTreeItem,
  databaseInfoManager: DatabaseInfoManager
): Promise<void> {
  const tableGroupId = tableGroupTreeItem.databaseItemId;
  if (!tableGroupId) {
    vscode.window.showErrorMessage("Could not find table group to select");
    return;
  }

  const databaseId =
    databaseInfoManager.getDatabaseIdByTableGroupId(tableGroupId);
  if (!databaseId) {
    vscode.window.showErrorMessage(
      "Could not find database associated with table group"
    );
    return;
  }

  try {
    await databaseInfoManager.setActiveTableGroupAndDatabase(
      tableGroupId,
      databaseId
    );
    vscode.window.showInformationMessage(
      `Selected table group ${tableGroupTreeItem.label} and database ${databaseId}`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to select table group: ${error}`);
    return;
  }

  await vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
  await vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableGroup");
}
