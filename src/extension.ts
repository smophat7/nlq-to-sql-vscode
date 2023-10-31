import * as vscode from "vscode";
import { generateSql } from "./command/generateSql";
import { DatabaseInfoManager } from "./database/DatabaseInfoManager";
import { addDatabase } from "./command/addDatabase";
import {
  DatabaseExplorerTreeViewProvider,
  DatabaseInfoTreeItem,
} from "./treeView/DatabaseExplorerTreeViewProvider";
import { removeDatabase } from "./command/removeDatabase";

export function activate(context: vscode.ExtensionContext) {
  const databaseInfoManager = new DatabaseInfoManager(context.workspaceState);
  const databaseExplorerTreeViewProvider = new DatabaseExplorerTreeViewProvider(
    context,
    databaseInfoManager
  );

  const registerDatabaseExplorerTreeViewProvider =
    vscode.window.registerTreeDataProvider(
      "nlq-to-sql.databaseExplorer",
      databaseExplorerTreeViewProvider
    );

  const setDatabaseCommand = vscode.commands.registerCommand(
    "nlq-to-sql.addDatabase",
    async () => {
      addDatabase(databaseInfoManager);
    }
  );

  const generateSqlCommand = vscode.commands.registerCommand(
    "nlq-to-sql.generateSql",
    async () => {
      generateSql(databaseInfoManager);
    }
  );

  const refreshDatabaseExplorerCommand = vscode.commands.registerCommand(
    "nlq-to-sql.refreshDatabaseExplorer",
    () => {
      databaseExplorerTreeViewProvider.refresh();
    }
  );

  const removeDatabaseCommand = vscode.commands.registerCommand(
    "nlq-to-sql.removeDatabase",
    (databaseInfoTreeItem: DatabaseInfoTreeItem) => {
      removeDatabase(databaseInfoTreeItem, databaseInfoManager);
    }
  );

  context.subscriptions.push(
    registerDatabaseExplorerTreeViewProvider,
    generateSqlCommand,
    setDatabaseCommand,
    refreshDatabaseExplorerCommand,
    removeDatabaseCommand
  );
}

export function deactivate() {}
