import * as vscode from "vscode";
import { generateSql } from "./command/generateSql";
import { DatabaseInfoManager } from "./database/DatabaseInfoManager";
import { addDatabase } from "./command/addDatabase";
import { DatabaseExplorerTreeViewProvider } from "./treeView/DatabaseExplorerTreeViewProvider";
import {
  DatabaseInfoTreeItem,
  FolderTreeItem,
  TableContextTreeItem,
} from "./treeView/DatabaseTreeViewItem";
import { removeDatabase } from "./command/removeDatabase";
import { selectTableContext } from "./command/selectTableContext";
import { ActiveTableContextTreeViewProvider } from "./treeView/ActiveTableContextTreeViewProvider";
import { addTablesToContext } from "./command/addTablesToContext";
import { addTableContext } from "./command/addTableContext";
import { removeTableContext } from "./command/removeTableContext";

export function activate(context: vscode.ExtensionContext) {
  const databaseInfoManager = new DatabaseInfoManager(context.workspaceState);
  const databaseExplorerTreeViewProvider = new DatabaseExplorerTreeViewProvider(
    databaseInfoManager
  );
  const activeTableContextTreeViewProvider =
    new ActiveTableContextTreeViewProvider(databaseInfoManager);

  const registerDatabaseExplorerTreeViewProvider =
    vscode.window.registerTreeDataProvider(
      "nlq-to-sql.databaseExplorer",
      databaseExplorerTreeViewProvider
    );

  const registerActiveTableContextTreeViewProvider =
    vscode.window.registerTreeDataProvider(
      "nlq-to-sql.activeTableContext",
      activeTableContextTreeViewProvider
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

  const refreshActiveTableContextCommand = vscode.commands.registerCommand(
    "nlq-to-sql.refreshActiveTableContext",
    () => {
      activeTableContextTreeViewProvider.refresh();
    }
  );

  const removeDatabaseCommand = vscode.commands.registerCommand(
    "nlq-to-sql.removeDatabase",
    async (databaseInfoTreeItem: DatabaseInfoTreeItem) => {
      await removeDatabase(databaseInfoTreeItem, databaseInfoManager);
    }
  );

  const selectTableContextCommand = vscode.commands.registerCommand(
    "nlq-to-sql.selectTableContext",
    async (tableContextTreeItem: TableContextTreeItem) => {
      await selectTableContext(tableContextTreeItem, databaseInfoManager);
    }
  );

  const addTablesToContextCommand = vscode.commands.registerCommand(
    "nlq-to-sql.addTablesToContext",
    async (tableContexTreeItem: TableContextTreeItem) => {
      await addTablesToContext(tableContexTreeItem, databaseInfoManager);
    }
  );

  const addTableContextCommand = vscode.commands.registerCommand(
    "nlq-to-sql.addTableContext",
    async (folderTreeItem: FolderTreeItem) => {
      await addTableContext(folderTreeItem, databaseInfoManager);
    }
  );

  const removeTableContextCommand = vscode.commands.registerCommand(
    "nlq-to-sql.removeTableContext",
    async (tableContextTreeItem: TableContextTreeItem) => {
      await removeTableContext(tableContextTreeItem, databaseInfoManager);
    }
  );

  context.subscriptions.push(
    registerDatabaseExplorerTreeViewProvider,
    registerActiveTableContextTreeViewProvider,
    addDatabaseCommand,
    generateSqlCommand,
    refreshDatabaseExplorerCommand,
    refreshActiveTableContextCommand,
    removeDatabaseCommand,
    selectTableContextCommand,
    addTablesToContextCommand,
    addTableContextCommand,
    removeTableContextCommand
  );
}

export async function deactivate(): Promise<void> {}
