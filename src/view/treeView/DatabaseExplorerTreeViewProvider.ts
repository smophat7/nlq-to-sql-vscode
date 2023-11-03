import * as vscode from "vscode";
import { DatabaseInfoManager } from "../../database/DatabaseInfoManager";
import { DatabaseTreeViewItem } from "./DatabaseTreeViewItem";
import { convertDatabaseInfoToDatabaseExplorerItem } from "./DatabaseTreeViewItem";

/**
 * Tree view provider for the database explorer.
 * The database explorer is used to view and manage the databases that are available for NLQ-to-SQL queries.
 */
export class DatabaseExplorerTreeViewProvider
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
      let databaseMap = this.databaseInfoManager.getDatabases();
      if (!databaseMap) {
        return [];
      }
      const databaseInfos = Array.from(databaseMap.values());
      const databaseInfoTreeItems = databaseInfos.map((databaseInfo) =>
        convertDatabaseInfoToDatabaseExplorerItem(databaseInfo)
      );
      return databaseInfoTreeItems;
    }
    if (element instanceof DatabaseTreeViewItem) {
      return element.children;
    }
    return []; // Should never reach
  }
}
