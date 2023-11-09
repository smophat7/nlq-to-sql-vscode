import * as vscode from "vscode";
import * as fs from "fs";
import { addDatabase } from "../database/addDatabase";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import * as constants from "../constants";

/**
 * Manages AddDatabase webview panels
 */
export class AddDatabasePanelManager {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: AddDatabasePanelManager | undefined;

  public static readonly viewType = "addDatabase";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private readonly _databaseInfoManager: DatabaseInfoManager;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    databaseInfoManager: DatabaseInfoManager
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // Show existing panel or create a new one if none exists
    if (AddDatabasePanelManager.currentPanel) {
      AddDatabasePanelManager.currentPanel._panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      AddDatabasePanelManager.viewType,
      "NLQ-to-SQL: Add Database",
      column || vscode.ViewColumn.One,
      getWebviewOptions(extensionUri)
    );
    AddDatabasePanelManager.currentPanel = new AddDatabasePanelManager(
      panel,
      extensionUri,
      databaseInfoManager
    );
  }

  public static revive(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    databaseInfoManager: DatabaseInfoManager
  ) {
    AddDatabasePanelManager.currentPanel = new AddDatabasePanelManager(
      panel,
      extensionUri,
      databaseInfoManager
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    databaseInfoManager: DatabaseInfoManager
  ) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._databaseInfoManager = databaseInfoManager;

    this._update(); // Set the webview's initial html content
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables); // Listen for panel disposal (user closes it or closed programatically)

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case constants.ADD_DATABASE_COMMAND_MESSAGE_CODE:
            const ifAdded = await addDatabase(
              this._databaseInfoManager,
              message.dbName,
              message.sqlDialect,
              message.createTableStatements
            );
            if (ifAdded) {
              this._panel.dispose();
            }
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    AddDatabasePanelManager.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const webviewUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out", "webview.js")
    );
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );
    const nonce = getNonce(); // To only allow specific scripts to be run

    // Use the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
            webview.cspSource
          }; script-src 'nonce-${nonce}';">
          <link href="${stylesUri}" rel="stylesheet" />
          <title>Add Database</title>
        </head>
        <body>
          ${this._getFormHtml()}
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }

  private _getFormHtml(): string {
    return /*html*/ `
      <form class="form" id="${constants.FORM_ELEMENT_ID}">
        <vscode-text-field class="input-field" id="${constants.DATABASE_NAME_ELEMENT_ID}">Database Name</vscode-text-field><br />
        <vscode-text-field class="input-field" id="${constants.SQL_DIALENCT_ELEMENT_ID}" placeholder="SQLite, MySQL, T-SQL, etc.">SQL Dialect</vscode-text-field><br />
        <vscode-text-area class="input-field" id="${constants.CREATE_TABLE_STATEMENTS_ELEMENT_ID}" rows="22" cols="70" placeholder="${constants.CREATE_TABLE_STATEMENTS_ELEMENT_PLACEHOLDER}">CREATE TABLE Statements (semicolon ";" separated)</vscode-text-area><br />
        <vscode-button type="submit" id="${constants.FORM_SUBMIT_BUTTON_ELEMENT_ID}">Add Database</vscode-button>
        <p class="error-message" id="${constants.VALIDATION_MESSAGE_ELEMENT_ID}">All fields are required.</p>
      </form>
    `;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function getWebviewOptions(
  extensionUri: vscode.Uri
): vscode.WebviewOptions {
  return {
    enableScripts: true, // Enable javascript in the webview
    localResourceRoots: [
      vscode.Uri.joinPath(extensionUri, "media"),
      vscode.Uri.joinPath(extensionUri, "out"),
    ], // Restrict the webview to only loading content from our extension's `media` and `out` directories.
  };
}
