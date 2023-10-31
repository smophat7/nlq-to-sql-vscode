import * as vscode from "vscode";

import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { TableContextTreeItem } from "../treeView/DatabaseTreeViewItem";

/**
 * Removes a table context from the extension workspace state after user confirmation.
 *
 * @param tableContextTreeItem
 * @param databaseInfoManager
 */
export async function removeTableContext(
  tableContextTreeItem: TableContextTreeItem,
  databaseInfoManager: DatabaseInfoManager
): Promise<void> {
  const tableContextId = tableContextTreeItem.databaseItemId;
  if (!tableContextId) {
    vscode.window.showErrorMessage("Could not find table context to remove");
    return;
  }

  // Get user confirmation
  const quickPickLabels = [
    {
      label: "Yes",
      description:
        "Permanently remove the selected table context from the NLQ-to-SQL extension",
    },
    { label: "Cancel" },
  ];
  const userSelection = await vscode.window.showQuickPick(quickPickLabels, {
    placeHolder: "Are you sure you want to remove the context?",
  });
  if (userSelection) {
    if (userSelection?.label === "Yes") {
      await databaseInfoManager.removeTableContext(tableContextId);
    } else {
      vscode.window.showInformationMessage("Request canceled");
    }
  } else {
    return;
  }

  vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
  vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableContext");
}
