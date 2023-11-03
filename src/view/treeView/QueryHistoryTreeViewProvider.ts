import * as vscode from "vscode";
import { DatabaseInfoManager } from "../../database/DatabaseInfoManager";
import {
  DatabaseTreeViewItem,
  QueryInfoTreeItem,
  convertQueryInfoToQueryInfoTreeItem,
} from "./DatabaseTreeViewItem";
import { convertDatabaseInfoToDatabaseExplorerItem } from "./DatabaseTreeViewItem";

/**
 * Tree view provider for the query history.
 * The query history is used to view and manage the queries that have been executed.
 */
export class QueryHistoryTreeViewProvider
  implements vscode.TreeDataProvider<QueryInfoTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    QueryInfoTreeItem | undefined
  > = new vscode.EventEmitter<QueryInfoTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<QueryInfoTreeItem | undefined> =
    this._onDidChangeTreeData.event;

  constructor(private readonly databaseInfoManager: DatabaseInfoManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: QueryInfoTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: DatabaseTreeViewItem | undefined
  ): vscode.ProviderResult<QueryInfoTreeItem[]> {
    if (element === undefined) {
      let queryHistory = this.databaseInfoManager.getQueryHistory();
      if (!queryHistory) {
        return [];
      }

      // sort queryInfos by dateUtc, most recent first
      const queryInfos = Array.from(queryHistory.values()).sort((a, b) => {
        if (!a.dateUtc || !b.dateUtc) {
          return 0;
        }
        return a.dateUtc > b.dateUtc ? -1 : 1;
      });

      const queryInfoTreeItems = queryInfos.map((queryInfo) =>
        convertQueryInfoToQueryInfoTreeItem(queryInfo)
      );
      return queryInfoTreeItems;
    }
    // if (element instanceof DatabaseTreeViewItem) {
    //   return element.children;
    // }
    return []; // Should never reach
  }
}
