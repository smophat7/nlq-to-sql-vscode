import * as vscode from "vscode";

import {
  DatabaseInfo,
  TableInfo,
  TableContextInfo,
  QueryInfo,
} from "../database/DatabaseInfo";
import * as constants from "../constants";

// TODO: Clean up and don't duplicate things like id and label
export class DatabaseTreeViewItem extends vscode.TreeItem {
  public databaseItemId?: string;
  public children?: DatabaseTreeViewItem[] = [];

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    children?: DatabaseTreeViewItem[],
    databaseItemId?: string,
    themeIcon?: vscode.ThemeIcon | undefined,
    tooltip?: string
  ) {
    super(label, collapsibleState);
    this.label = label;
    this.children = children;
    this.databaseItemId = databaseItemId;
    this.iconPath = themeIcon;
    this.tooltip = tooltip;
  }
}

export class FolderTreeItem extends DatabaseTreeViewItem {
  constructor(
    label: string,
    children: TableInfoTreeItem[] | TableContextTreeItem[],
    databaseId: string,
    contextValue: string
  ) {
    super(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      children,
      databaseId, // In a FolderTreeItem, the databaseItemId is the database id to which the folder belongs
      new vscode.ThemeIcon(constants.FOLDER_ICON_CODE)
    );
    this.contextValue = contextValue;
  }
}

export class DatabaseInfoTreeItem extends DatabaseTreeViewItem {
  contextValue = "databaseInfo";
  constructor(
    label: string,
    children: FolderTreeItem[],
    databaseItemId: string,
    dialect: string
  ) {
    const tooltip = `Database: ${label}\nDialect: ${dialect}`;
    super(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      children,
      databaseItemId,
      new vscode.ThemeIcon(constants.DATABASE_ICON_CODE),
      tooltip
    );
  }
}

export class TableContextTreeItem extends DatabaseTreeViewItem {
  contextValue = "tableContext";
  constructor(
    label: string,
    children: TableInfoTreeItem[],
    databaseItemId: string
  ) {
    super(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      children,
      databaseItemId,
      new vscode.ThemeIcon(constants.TABLE_GROUP_ICON_CODE)
    );
  }
}

export class TableInfoTreeItem extends DatabaseTreeViewItem {
  constructor(
    label: string,
    databaseItemId: string,
    createStatementTooltip: string
  ) {
    super(
      label,
      vscode.TreeItemCollapsibleState.None,
      undefined,
      databaseItemId,
      new vscode.ThemeIcon(constants.TABLE_ICON_CODE),
      createStatementTooltip
    );
  }
}

export class QueryInfoTreeItem extends DatabaseTreeViewItem {
  contextValue = "queryInfo";
  constructor(label: string, queryId: string) {
    super(label, vscode.TreeItemCollapsibleState.None, undefined, queryId);
  }
}

export function convertDatabaseInfoToDatabaseExplorerItem(
  databaseInfo: DatabaseInfo
): DatabaseInfoTreeItem {
  const tableInfos = databaseInfo.tables;
  const tableContexts = databaseInfo.tableContexts;
  const tableInfoTreeItems = tableInfos.map((tableInfo) =>
    convertTableInfoToTableInfoTreeItem(tableInfo)
  );
  const tableContextTreeItems = tableContexts.map((tableContext) =>
    convertTableContextToTableContextTreeItem(tableContext, tableInfoTreeItems)
  );
  let folderTreeItems: FolderTreeItem[] = [
    new FolderTreeItem(
      "Tables",
      tableInfoTreeItems,
      databaseInfo.databaseId,
      "tablesFolder"
    ),
    new FolderTreeItem(
      "Contexts",
      tableContextTreeItems,
      databaseInfo.databaseId,
      "contextsFolder"
    ),
  ];
  return new DatabaseInfoTreeItem(
    databaseInfo.name,
    folderTreeItems,
    databaseInfo.databaseId,
    databaseInfo.dialect
  );
}

export function convertTableContextToTableContextTreeItem(
  tableContext: TableContextInfo,
  tableInfoTreeItems: TableInfoTreeItem[]
): TableContextTreeItem {
  let tableInfoTreeItemsInTableContext: TableInfoTreeItem[] = [];
  tableContext.tableIds.forEach((tableId) => {
    let tableInfoTreeItem = tableInfoTreeItems.find(
      (tableInfoTreeItem) => tableInfoTreeItem.databaseItemId === tableId
    );
    if (tableInfoTreeItem) {
      tableInfoTreeItemsInTableContext.push(tableInfoTreeItem);
    }
  });
  return new TableContextTreeItem(
    tableContext.tableContextName,
    tableInfoTreeItemsInTableContext,
    tableContext.tableContextId
  );
}

export function convertTableInfoToTableInfoTreeItem(tableInfo: TableInfo): any {
  return new TableInfoTreeItem(
    tableInfo.tableName,
    tableInfo.tableId,
    tableInfo.createTableStatement
  );
}

export function convertQueryInfoToQueryInfoTreeItem(queryInfo: QueryInfo) {
  return new QueryInfoTreeItem(queryInfo.query, queryInfo.queryId);
}
