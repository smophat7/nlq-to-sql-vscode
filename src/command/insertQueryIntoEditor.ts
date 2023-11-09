import * as vscode from "vscode";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { QueryInfoTreeItem } from "../views/DatabaseTreeViewItem";

/**
 * Inserts the query into the active editor at the current cursor position.
 *
 * @param queryInfoTreeItem Tree item containing the query to insert
 * @param databaseInfoManager
 */
export function insertQueryIntoEditor(
  queryInfoTreeItem: QueryInfoTreeItem,
  databaseInfoManager: DatabaseInfoManager
): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }

  const queryId = queryInfoTreeItem.databaseItemId;
  if (!queryId) {
    vscode.window.showErrorMessage("Could not find query to insert");
    return;
  }

  const queryInfo = databaseInfoManager.getQueryInfo(queryId);
  editor.edit((editBuilder) => {
    editBuilder.insert(editor.selection.active, queryInfo.query);
  });
}
