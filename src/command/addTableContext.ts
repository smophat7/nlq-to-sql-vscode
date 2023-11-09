import * as vscode from "vscode";

import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { FolderTreeItem } from "../views/DatabaseTreeViewItem";

/**
 * Gets user input for a name for a new table context, creates it, and adds it to the database contexts.
 *
 * @param folderTreeItem The tree item of the folder whose database to add the table context to.
 * @param databaseInfoManager
 */
export async function addTableContext(
  folderTreeItem: FolderTreeItem,
  databaseInfoManager: DatabaseInfoManager
) {
  const databases = databaseInfoManager.getDatabases();
  if (!databases) {
    vscode.window.showErrorMessage(
      "Could not find any databases in the workspace state"
    );
    return;
  }
  const databaseId = folderTreeItem.databaseItemId;
  if (!databaseId) {
    vscode.window.showErrorMessage(
      "Could not find database to add table context to"
    );
    return;
  }
  const database = databases.get(databaseId);
  if (!database) {
    vscode.window.showErrorMessage(
      "Could not find database to add table context to"
    );
    return;
  }

  const name = await vscode.window.showInputBox({
    prompt: "Enter a name for the new table context",
    placeHolder: "Table Context Name",
    validateInput: (value: string) => {
      if (value.length === 0) {
        return "Please enter a name for the table context";
      }
      return "";
    },
  });
  if (!name) {
    return;
  }

  await databaseInfoManager.addTableContext(databaseId, name);

  vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
  vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableContext");
}
