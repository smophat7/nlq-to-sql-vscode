import * as vscode from "vscode";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { DatabaseInfoTreeItem } from "../treeView/DatabaseTreeViewItem";

/**
 * Removes a database from the extension workspace state after user confirmation.
 *
 * @param databaseInfoTreeItem
 * @param databaseInfoManager
 * @returns
 */
export async function removeDatabase(
  databaseInfoTreeItem: DatabaseInfoTreeItem,
  databaseInfoManager: DatabaseInfoManager
): Promise<void> {
  const databaseId = databaseInfoTreeItem.databaseItemId;
  if (!databaseId) {
    vscode.window.showErrorMessage("Could not find database to remove");
    return;
  }

  // Get user confirmation
  const quickPickLabels = [
    {
      label: "Yes",
      description:
        "Permanently remove record of the selected database from NLQ-to-SQL extension",
    },
    { label: "Cancel" },
  ];
  const userSelection = await vscode.window.showQuickPick(quickPickLabels, {
    placeHolder: "Are you sure you want to remove the database?",
  });
  if (userSelection) {
    if (userSelection?.label === "Yes") {
      await databaseInfoManager.removeDatabase(databaseId);
    } else {
      vscode.window.showInformationMessage("Request canceled");
    }
  } else {
    return;
  }

  vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
  vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableContext");
}
