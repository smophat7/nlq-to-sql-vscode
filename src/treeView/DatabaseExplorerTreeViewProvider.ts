import * as vscode from "vscode";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import {
  DatabaseExplorerTreeItem,
  DatabaseInfoTreeItem,
  TableInfoTreeItem,
} from "./DatabaseExplorerTreeItem";
import { convertDatabaseInfoToDatabaseExplorerItem } from "./DatabaseExplorerTreeItem";

/**
 * Tree view provider for the database explorer.
 * The database explorer is used to view and manage the databases that are available for NLQ-to-SQL queries.
 */
export class DatabaseExplorerTreeViewProvider
  implements vscode.TreeDataProvider<DatabaseExplorerTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    DatabaseExplorerTreeItem | undefined
  > = new vscode.EventEmitter<DatabaseExplorerTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<
    DatabaseExplorerTreeItem | undefined
  > = this._onDidChangeTreeData.event;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly databaseInfoManager: DatabaseInfoManager
  ) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: DatabaseExplorerTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: DatabaseExplorerTreeItem | undefined
  ): vscode.ProviderResult<DatabaseExplorerTreeItem[]> {
    if (element === undefined) {
      let databaseMap = this.databaseInfoManager.databases;
      if (!databaseMap) {
        return [];
      }
      const databaseInfos = Array.from(databaseMap.values());
      const databaseInfoTreeItems = databaseInfos.map((databaseInfo) =>
        convertDatabaseInfoToDatabaseExplorerItem(databaseInfo)
      );
      return databaseInfoTreeItems;
    }
    if (element instanceof DatabaseInfoTreeItem) {
      return element.children;
    }
    if (element instanceof TableInfoTreeItem) {
      return element.children;
    }
  }
}
