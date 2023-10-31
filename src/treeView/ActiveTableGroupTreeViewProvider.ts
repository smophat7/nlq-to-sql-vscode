import * as vscode from "vscode";

import {
  DatabaseTreeViewItem,
  TableInfoTreeItem,
  convertTableGroupToTableGroupTreeItem,
  convertTableInfoToTableInfoTreeItem,
} from "./DatabaseTreeViewItem";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { TableInfo } from "../database/DatabaseInfo";
import * as constants from "../constants";

export class ActiveTableGroupTreeViewProvider
  implements vscode.TreeDataProvider<DatabaseTreeViewItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    DatabaseTreeViewItem | undefined
  > = new vscode.EventEmitter<DatabaseTreeViewItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<DatabaseTreeViewItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private readonly databaseInfoManager: DatabaseInfoManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: DatabaseTreeViewItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: DatabaseTreeViewItem | undefined
  ): vscode.ProviderResult<DatabaseTreeViewItem[]> {
    if (element === undefined) {
      let databaseMap = this.databaseInfoManager.databases;
      if (!databaseMap) {
        return [];
      }

      const activeDatabaseId = this.databaseInfoManager.activeDatabaseId;
      if (!activeDatabaseId) {
        return []; // TODO: How to handle if no active database?
      }

      const database = databaseMap.get(activeDatabaseId);
      if (!database) {
        return []; // TODO: How to handle if no valid database?
      }

      const activeTableGroupInfo =
        this.databaseInfoManager.getActiveTableGroupInfo(activeDatabaseId);

      const tableIds = activeTableGroupInfo.tableIds;
      if (!tableIds) {
        return []; // TODO: How to handle if no tables?
      }

      const tableInfoTreeItems: TableInfoTreeItem[] = tableIds.map(
        (tableId) => {
          const tableInfo: TableInfo = this.databaseInfoManager.getTableInfo(
            tableId,
            activeDatabaseId
          );
          if (!tableInfo) {
            return;
          }
          return convertTableInfoToTableInfoTreeItem(tableInfo);
        }
      );

      let activeTableGroupTreeItem = convertTableGroupToTableGroupTreeItem(
        activeTableGroupInfo,
        tableInfoTreeItems
      );
      activeTableGroupTreeItem.iconPath = new vscode.ThemeIcon(
        constants.ACTIVE_TABLE_GROUP_ICON_CODE
      );
      activeTableGroupTreeItem.label = `${database.name} > ${activeTableGroupTreeItem.label}`;
      activeTableGroupTreeItem.collapsibleState =
        vscode.TreeItemCollapsibleState.Expanded;
      return [activeTableGroupTreeItem];
    }
    if (element instanceof DatabaseTreeViewItem) {
      return element.children;
    }
    return []; // Should never reach
  }
}
