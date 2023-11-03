import * as vscode from "vscode";

import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { QueryInfoTreeItem } from "../view/treeView/DatabaseTreeViewItem";

/**
 * Copies the query to the clipboard.
 *
 * @param queryInfoTreeItem Tree item containing the query to copy
 * @param databaseInfoManager
 */
export async function copyQuery(
  queryInfoTreeItem: QueryInfoTreeItem,
  databaseInfoManager: DatabaseInfoManager
): Promise<void> {
  const queryId = queryInfoTreeItem.databaseItemId;
  if (!queryId) {
    vscode.window.showErrorMessage("Could not find query to copy");
    return;
  }

  const queryInfo = await databaseInfoManager.getQueryInfo(queryId);
  await vscode.env.clipboard.writeText(queryInfo.query);
  vscode.window.showInformationMessage(`Copied query to clipboard`);
}
