import * as vscode from "vscode";

import {
  DatabaseInfo,
  TableInfo,
  TableContextInfo,
  QueryInfo,
} from "../database/DatabaseInfo";
import * as constants from "../constants";

export class DatabaseTreeViewItem extends vscode.TreeItem {
  public databaseItemId?: string;
  children: DatabaseTreeViewItem[] | undefined;

  constructor(
    label: string,
    databaseItemId?: string,
    children?: DatabaseTreeViewItem[]
  ) {
    super(label);
    this.databaseItemId = databaseItemId;
    this.children = children;
  }
}

export class TablesFolderTreeItem extends DatabaseTreeViewItem {
  contextValue = "tablesFolder";
  iconPath = new vscode.ThemeIcon(constants.FOLDER_ICON_CODE);
  collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

  constructor(
    label: string,
    databaseId: string,
    children: TableInfoTreeItem[]
  ) {
    super(label, databaseId, children);
  }
}

export class ContextsFolderTreeItem extends DatabaseTreeViewItem {
  contextValue = "contextsFolder";
  iconPath = new vscode.ThemeIcon(constants.FOLDER_ICON_CODE);
  collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

  constructor(
    label: string,
    databaseId: string,
    children: TableContextTreeItem[]
  ) {
    super(label, databaseId, children);
  }
}

export class DatabaseInfoTreeItem extends DatabaseTreeViewItem {
  contextValue = "databaseInfo";
  iconPath = new vscode.ThemeIcon(constants.DATABASE_ICON_CODE);
  collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

  constructor(
    label: string,
    children: (TablesFolderTreeItem | ContextsFolderTreeItem)[],
    databaseItemId: string,
    dialect: string
  ) {
    super(label, databaseItemId, children);
    this.tooltip = `Database: ${label}\nDialect: ${dialect}`;
  }
}

export class TableContextTreeItem extends DatabaseTreeViewItem {
  contextValue = "tableContext";
  iconPath = new vscode.ThemeIcon(constants.TABLE_GROUP_ICON_CODE);
  collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

  constructor(
    label: string,
    databaseItemId: string,
    children: TableInfoTreeItem[]
  ) {
    super(label, databaseItemId, children);
  }
}

export class TableInfoTreeItem extends DatabaseTreeViewItem {
  iconPath = new vscode.ThemeIcon(constants.TABLE_ICON_CODE);
  collapsibleState = vscode.TreeItemCollapsibleState.None;

  constructor(
    label: string,
    databaseItemId: string,
    createStatementTooltip: string
  ) {
    super(label, databaseItemId);
    this.tooltip = createStatementTooltip;
  }
}

export class QueryInfoTreeItem extends DatabaseTreeViewItem {
  contextValue = "queryInfo";
  collapsibleState = vscode.TreeItemCollapsibleState.None;

  constructor(sql: string, nlq: string, queryId: string) {
    super(`${nlq}\n...\n${sql}`, queryId);
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
  let folderTreeItems: (TablesFolderTreeItem | ContextsFolderTreeItem)[] = [
    new TablesFolderTreeItem(
      "Tables",
      databaseInfo.databaseId,
      tableInfoTreeItems
    ),
    new ContextsFolderTreeItem(
      "Contexts",
      databaseInfo.databaseId,
      tableContextTreeItems
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
    tableContext.tableContextId,
    tableInfoTreeItemsInTableContext
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
  return new QueryInfoTreeItem(queryInfo.sql, queryInfo.nlq, queryInfo.queryId);
}
