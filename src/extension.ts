import * as vscode from "vscode";
import { generateSql } from "./command/generateSql";
import { DatabaseInfoManager } from "./database/DatabaseInfoManager";
import { DatabaseExplorerTreeViewProvider } from "./views/DatabaseExplorerTreeViewProvider";
import { ActiveTableContextTreeViewProvider } from "./views/ActiveTableContextTreeViewProvider";
import { QueryHistoryTreeViewProvider } from "./views/QueryHistoryTreeViewProvider";
import {
  ContextsFolderTreeItem,
  DatabaseInfoTreeItem,
  QueryInfoTreeItem,
  TableContextTreeItem,
} from "./views/DatabaseTreeViewItem";
import { removeDatabase } from "./command/removeDatabase";
import { selectTableContext } from "./command/selectTableContext";
import { addTablesToContext } from "./command/addTablesToContext";
import { addTableContext } from "./command/addTableContext";
import { removeTableContext } from "./command/removeTableContext";
import { clearQueryHistory } from "./command/clearQueryHistory";
import { removeQueryFromHistory } from "./command/removeQueryFromHistory";
import { insertQueryIntoEditor } from "./command/insertQueryIntoEditor";
import { copyQuery } from "./command/copyQuery";
import {
  AddDatabasePanelManager,
  getWebviewOptions,
} from "./views/AddDatabasePanel";

export function activate(context: vscode.ExtensionContext) {
  const databaseInfoManager = new DatabaseInfoManager(context.workspaceState);
  const databaseExplorerTreeViewProvider = new DatabaseExplorerTreeViewProvider(
    databaseInfoManager
  );
  const activeTableContextTreeViewProvider =
    new ActiveTableContextTreeViewProvider(databaseInfoManager);
  const queryHistoryTreeViewProvider = new QueryHistoryTreeViewProvider(
    databaseInfoManager
  );

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

  const registerQueryHistoryTreeViewProvider =
    vscode.window.registerTreeDataProvider(
      "nlq-to-sql.queryHistory",
      queryHistoryTreeViewProvider
    );

  const registerAddDatabaseWebviewPanelSerializer =
    vscode.window.registerWebviewPanelSerializer("nlq-to-sql.addDatabase", {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel) {
        // Reset the webview options so we use latest uri for `localResourceRoots`.
        webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
        AddDatabasePanelManager.revive(
          webviewPanel,
          context.extensionUri,
          databaseInfoManager
        );
      },
    });

  const addDatabaseCommand = vscode.commands.registerCommand(
    "nlq-to-sql.addDatabase",
    async () => {
      AddDatabasePanelManager.createOrShow(
        context.extensionUri,
        databaseInfoManager
      );
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

  const refreshQueryHistoryCommand = vscode.commands.registerCommand(
    "nlq-to-sql.refreshQueryHistory",
    () => {
      queryHistoryTreeViewProvider.refresh();
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
    async (contextsFolderTreeItem: ContextsFolderTreeItem) => {
      await addTableContext(contextsFolderTreeItem, databaseInfoManager);
    }
  );

  const removeTableContextCommand = vscode.commands.registerCommand(
    "nlq-to-sql.removeTableContext",
    async (tableContextTreeItem: TableContextTreeItem) => {
      await removeTableContext(tableContextTreeItem, databaseInfoManager);
    }
  );

  const insertQueryIntoEditorCommand = vscode.commands.registerCommand(
    "nlq-to-sql.insertQuery",
    (queryInfoTreeItem: QueryInfoTreeItem) => {
      insertQueryIntoEditor(queryInfoTreeItem, databaseInfoManager);
    }
  );

  const copyQueryCommand = vscode.commands.registerCommand(
    "nlq-to-sql.copyQuery",
    async (queryInfoTreeItem: QueryInfoTreeItem) => {
      await copyQuery(queryInfoTreeItem, databaseInfoManager);
    }
  );

  const clearQueryHistoryCommand = vscode.commands.registerCommand(
    "nlq-to-sql.clearQueryHistory",
    async () => {
      await clearQueryHistory(databaseInfoManager);
    }
  );

  const removeQueryFromHistoryCommand = vscode.commands.registerCommand(
    "nlq-to-sql.removeQueryFromHistory",
    async (queryInfoTreeItem: QueryInfoTreeItem) => {
      await removeQueryFromHistory(queryInfoTreeItem, databaseInfoManager);
    }
  );

  context.subscriptions.push(
    registerDatabaseExplorerTreeViewProvider,
    registerActiveTableContextTreeViewProvider,
    registerQueryHistoryTreeViewProvider,
    registerAddDatabaseWebviewPanelSerializer,
    addDatabaseCommand,
    generateSqlCommand,
    refreshDatabaseExplorerCommand,
    refreshActiveTableContextCommand,
    refreshQueryHistoryCommand,
    removeDatabaseCommand,
    selectTableContextCommand,
    addTablesToContextCommand,
    addTableContextCommand,
    removeTableContextCommand,
    insertQueryIntoEditorCommand,
    copyQueryCommand,
    clearQueryHistoryCommand,
    removeQueryFromHistoryCommand
  );
}

export async function deactivate(): Promise<void> {}
