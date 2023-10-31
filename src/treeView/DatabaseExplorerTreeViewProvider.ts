import * as vscode from "vscode";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import {
  DatabaseInfo,
  TableInfo,
  AttributeInfo,
} from "../database/DatabaseInfo";

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

// TODO: Clean up and don't duplicate things like id and label
class DatabaseExplorerTreeItem extends vscode.TreeItem {
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

class TableInfoTreeItem extends DatabaseExplorerTreeItem {
  constructor(label: string, children: AttributeInfoTreeItem[], id: string) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed, children, id);
  }
}

class AttributeInfoTreeItem extends DatabaseExplorerTreeItem {
  constructor(label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

function convertDatabaseInfoToDatabaseExplorerItem(
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
