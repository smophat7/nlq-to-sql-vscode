import * as vscode from "vscode";
import { generateSql } from "./command/generateSql";
import { DatabaseInfoManager } from "./database/DatabaseInfoManager";
import { addDatabase } from "./command/addDatabase";
import { DatabaseExplorerTreeViewProvider } from "./treeView/DatabaseExplorerTreeViewProvider";
import {
  DatabaseInfoTreeItem,
  TableGroupTreeItem,
} from "./treeView/DatabaseTreeViewItem";
import { removeDatabase } from "./command/removeDatabase";
import { selectTableGroup } from "./command/selectTableGroup";
import { ActiveTableGroupTreeViewProvider } from "./treeView/ActiveTableGroupTreeViewProvider";

export function activate(context: vscode.ExtensionContext) {
  const databaseInfoManager = new DatabaseInfoManager(context.workspaceState);
  const databaseExplorerTreeViewProvider = new DatabaseExplorerTreeViewProvider(
    databaseInfoManager
  );
  const activeTableGroupTreeViewProvider = new ActiveTableGroupTreeViewProvider(
    databaseInfoManager
  );

  const registerDatabaseExplorerTreeViewProvider =
    vscode.window.registerTreeDataProvider(
      "nlq-to-sql.databaseExplorer",
      databaseExplorerTreeViewProvider
    );

  const registerActiveTableGroupTreeViewProvider =
    vscode.window.registerTreeDataProvider(
      "nlq-to-sql.activeTableGroup",
      activeTableGroupTreeViewProvider
    );

  const addDatabaseCommand = vscode.commands.registerCommand(
    "nlq-to-sql.addDatabase",
    async () => {
      await addDatabase(databaseInfoManager);
    }
  );

  const generateSqlCommand = vscode.commands.registerCommand(
    "nlq-to-sql.generateSql",
    async () => {
      await generateSql(databaseInfoManager);
    }
  );

  const refreshDatabaseExplorerCommand = vscode.commands.registerCommand(
    "nlq-to-sql.refreshDatabaseExplorer",
    () => {
      databaseExplorerTreeViewProvider.refresh();
    }
  );

  const refreshActiveTableGroupCommand = vscode.commands.registerCommand(
    "nlq-to-sql.refreshActiveTableGroup",
    () => {
      activeTableGroupTreeViewProvider.refresh();
    }
  );

  const removeDatabaseCommand = vscode.commands.registerCommand(
    "nlq-to-sql.removeDatabase",
    async (databaseInfoTreeItem: DatabaseInfoTreeItem) => {
      await removeDatabase(databaseInfoTreeItem, databaseInfoManager);
    }
  );

  const selectTableGroupCommand = vscode.commands.registerCommand(
    "nlq-to-sql.selectTableGroup",
    async (tableGroupTreeItem: TableGroupTreeItem) => {
      await selectTableGroup(tableGroupTreeItem, databaseInfoManager);
    }
  );

  context.subscriptions.push(
    registerDatabaseExplorerTreeViewProvider,
    registerActiveTableGroupTreeViewProvider,
    addDatabaseCommand,
    generateSqlCommand,
    refreshDatabaseExplorerCommand,
    refreshActiveTableGroupCommand,
    removeDatabaseCommand,
    selectTableGroupCommand
  );
}

export function deactivate() {}
