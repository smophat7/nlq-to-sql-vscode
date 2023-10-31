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
  await vscode.window
    .showQuickPick(
      [
        {
          label: "Yes",
          description:
            "Permanently remove record of the selected database from NLQ-to-SQL extension",
        },
        { label: "Cancel" },
      ],
      { placeHolder: "Are you sure you want to remove the database?" }
    )
    .then((value) => {
      if (value?.label === "Yes") {
        databaseInfoManager.removeDatabase(databaseId);
      } else {
        vscode.window.showInformationMessage("Request canceled");
      }
    });

  vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
  vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableGroup");
}
