import * as vscode from "vscode";

import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import {
  FolderTreeItem,
  TableContextTreeItem,
} from "../view/treeView/DatabaseTreeViewItem";

/**
 * Gets user input to select tables to add to the selected table context.
 * Sets the active table context to the selected table context.
 *
 * @param tableContexTreeItem The tree item of the table context to add tables to.
 * @param databaseInfoManager
 */
export async function addTablesToContext(
  tableContexTreeItem: TableContextTreeItem,
  databaseInfoManager: DatabaseInfoManager
) {
  const databaseMap = databaseInfoManager.getDatabases();
  if (!databaseMap) {
    vscode.window.showErrorMessage(
      "Could not find any databases in the workspace state"
    );
    return;
  }

  const tableContextId = tableContexTreeItem.databaseItemId;
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

  let database = databaseMap.get(databaseId);
  if (!database) {
    vscode.window.showErrorMessage(
      "Could not find database associated with table context"
    );
    return;
  }

  const tableContext = database.tableContexts.find(
    (tableContextInfo) => tableContextInfo.tableContextId === tableContextId
  );
  if (!tableContext) {
    vscode.window.showErrorMessage(
      "Could not find table context associated with table context id"
    );
    return;
  }

  const tableInfos = database.tables.filter((tableInfo) => {
    return !tableContext.tableIds.includes(tableInfo.tableId);
  });

  if (tableInfos.length === 0) {
    vscode.window.showErrorMessage(
      "Could not find any additional tables to add to table context"
    );
    return;
  }

  const tableLabels = tableInfos.map((tableInfo) => tableInfo.tableName);
  const selectedTableNames = await vscode.window.showQuickPick(tableLabels, {
    canPickMany: true,
  });
  if (selectedTableNames) {
    const selectedTableIds = selectedTableNames
      .map((tableName) => {
        const tableInfo = tableInfos.find(
          (tableInfo) => tableInfo.tableName === tableName
        );
        if (tableInfo) {
          return tableInfo.tableId;
        }
        return undefined;
      })
      .filter((tableId) => tableId !== undefined) as string[];

    tableContext.tableIds.push(...selectedTableIds);
    database.activeContext = tableContext.tableContextId;
    await databaseInfoManager.updateDatabase(database);

    vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
    vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableContext");
  }
}
