import * as vscode from "vscode";

import {
  DatabaseInfo,
  TableInfo,
  AttributeInfo,
  TableGroupInfo,
} from "../database/DatabaseInfo";
import * as constants from "../constants";

// TODO: Clean up and don't duplicate things like id and label
export class DatabaseExplorerTreeItem extends vscode.TreeItem {
  public databaseItemId?: string;
  public label: string;
  public children?: DatabaseExplorerTreeItem[] = [];

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    children?: DatabaseExplorerTreeItem[],
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

export class FolderTreeItem extends DatabaseExplorerTreeItem {
  constructor(
    label: string,
    children: TableInfoTreeItem[] | TableGroupTreeItem[]
  ) {
    super(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      children,
      undefined,
      new vscode.ThemeIcon(constants.FOLDER_ICON_CODE)
    );
  }
}

export class DatabaseInfoTreeItem extends DatabaseExplorerTreeItem {
  contextValue = "databaseInfo";
  constructor(
    label: string,
    children: FolderTreeItem[],
    databaseItemId: string,
    filePath: string
  ) {
    super(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      children,
      databaseItemId,
      new vscode.ThemeIcon(constants.DATABASE_ICON_CODE),
      filePath
    );
  }
}

export class TableGroupTreeItem extends DatabaseExplorerTreeItem {
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

export class TableInfoTreeItem extends DatabaseExplorerTreeItem {
  constructor(
    label: string,
    children: AttributeInfoTreeItem[],
    databaseItemId: string
  ) {
    super(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      children,
      databaseItemId,
      new vscode.ThemeIcon(constants.TABLE_ICON_CODE)
    );
  }
}

export class AttributeInfoTreeItem extends DatabaseExplorerTreeItem {
  constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export function convertDatabaseInfoToDatabaseExplorerItem(
  databaseInfo: DatabaseInfo
): DatabaseInfoTreeItem {
  const tableInfos = databaseInfo.tables;
  const tableGroups = databaseInfo.tableGroups;
  const tableInfoTreeItems = tableInfos.map((tableInfo) =>
    convertTableInfoToTableInfoTreeItem(tableInfo)
  );
  const tableGroupTreeItems = tableGroups.map((tableGroup) =>
    convertTableGroupToTableGroupTreeItem(tableGroup, tableInfoTreeItems)
  );
  let folderTreeItems: FolderTreeItem[] = [
    new FolderTreeItem("Tables", tableInfoTreeItems),
    new FolderTreeItem("Environment Groups", tableGroupTreeItems),
  ];
  return new DatabaseInfoTreeItem(
    databaseInfo.name,
    folderTreeItems,
    databaseInfo.databaseId,
    databaseInfo.path
  );
}

function convertTableGroupToTableGroupTreeItem(
  tableGroup: TableGroupInfo,
  tableInfoTreeItems: TableInfoTreeItem[]
): TableGroupTreeItem {
  let tableInfoTreeItemsInTableGroup: TableInfoTreeItem[] = [];
  tableGroup.tableIds.forEach((tableId) => {
    let tableInfoTreeItem = tableInfoTreeItems.find(
      (tableInfoTreeItem) => tableInfoTreeItem.databaseItemId === tableId
    );
    if (tableInfoTreeItem) {
      tableInfoTreeItemsInTableGroup.push(tableInfoTreeItem);
    }
  });
  return new TableGroupTreeItem(
    tableGroup.tableGroupName,
    tableInfoTreeItemsInTableGroup,
    tableGroup.tableGroupId
  );
}

function convertTableInfoToTableInfoTreeItem(tableInfo: TableInfo): any {
  const attributeInfos = tableInfo.attributes;
  const attributeInfoTreeItems = attributeInfos.map((attributeInfo) =>
    convertAttributeInfoToAttributeInfoTreeItem(attributeInfo)
  );
  return new TableInfoTreeItem(
    tableInfo.tableName,
    attributeInfoTreeItems,
    tableInfo.tableId
  );
}

function convertAttributeInfoToAttributeInfoTreeItem(
  attributeInfo: AttributeInfo
): any {
  return new AttributeInfoTreeItem(
    `${attributeInfo.attributeName}: ${attributeInfo.attributeType}`
  );
}
