import * as vscode from "vscode";
import {
  DatabaseInfo,
  TableInfo,
  AttributeInfo,
} from "../database/DatabaseInfo";

// TODO: Clean up and don't duplicate things like id and label
export class DatabaseExplorerTreeItem extends vscode.TreeItem {
  public id?: string;
  public label: string;
  public children?: DatabaseExplorerTreeItem[] = [];

  constructor(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    children?: DatabaseExplorerTreeItem[],
    id?: string,
    tooltip?: string
  ) {
    super(label, collapsibleState);
    this.label = label;
    this.children = children;
    this.id = id;
    this.tooltip = tooltip;
  }
}

export class DatabaseInfoTreeItem extends DatabaseExplorerTreeItem {
  contextValue = "databaseInfo";
  constructor(
    label: string,
    children: TableInfoTreeItem[],
    id: string,
    filePath: string
  ) {
    super(
      label,
      vscode.TreeItemCollapsibleState.Collapsed,
      children,
      id,
      filePath
    );
  }
}

export class TableInfoTreeItem extends DatabaseExplorerTreeItem {
  constructor(label: string, children: AttributeInfoTreeItem[], id: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed, children, id);
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
  const tableInfoTreeItems = tableInfos.map((tableInfo) =>
    convertTableInfoToTableInfoTreeItem(tableInfo)
  );
  return new DatabaseInfoTreeItem(
    databaseInfo.name,
    tableInfoTreeItems,
    databaseInfo.databaseId,
    databaseInfo.path
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
