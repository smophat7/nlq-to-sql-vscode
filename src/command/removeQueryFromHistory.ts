import * as vscode from "vscode";

import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { QueryInfoTreeItem } from "../view/treeView/DatabaseTreeViewItem";

export async function removeQueryFromHistory(
  queryInfoTreeItem: QueryInfoTreeItem,
  databaseInfoManager: DatabaseInfoManager
) {
  const queryId = queryInfoTreeItem.databaseItemId;
  if (!queryId) {
    vscode.window.showErrorMessage("Could not find query to remove");
    return;
  }

  await databaseInfoManager.removeQueryFromHistory(queryId);
  vscode.commands.executeCommand("nlq-to-sql.refreshQueryHistory");
}
