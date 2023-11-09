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
      {
        viewColumn: vscode.ViewColumn.Two,
        preserveFocus: true,
      },
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
          <div class="body-content">
            <h1>NLQ-to-SQL: Add Database</h1>
            ${this._getFormHtml()}
          </div>
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
      </html>
    `;
  }

  private _getFormHtml(): string {
    return /*html*/ `
      <form id="${constants.FORM_ELEMENT_ID}">
        <section class="input-section">
          <h2>Database Name</h2>
          <p>Keep it short and sweet. This will be displayed in the NLQ-to-SQL sidebar.</p>
          <vscode-text-field id="${constants.DATABASE_NAME_ELEMENT_ID}">Database Name</vscode-text-field>
        </section>
        <section class="input-section">
          <h2>SQL Dialect</h2>
          <p>
            This value will be used in the prompt for the LLM API to specify what syntax/features its generated SQL should use.
            Provide whatever dialect/flavor/vendor/version of SQL your database uses in the format that will be the most helpful to the LLM.
          </p>
          <vscode-text-field id="${constants.SQL_DIALENCT_ELEMENT_ID}" placeholder="SQLite, MySQL, T-SQL, etc.">SQL Dialect</vscode-text-field>
        </section>
        <section class="input-section">
          <h2>CREATE TABLE Statements</h2>
          <p>
            To generate more accurate SQL, the LLM must have some sense of the database schema. You can use a simple query on your database
            to get the <code>CREATE TABLE</code> statements for your database, which you can then paste here. The specific format
            isn't all that important, except they must be valid <code>CREATE TABLE</code> statements, and they must be separated by semicolons.
          </p>
          <p>
            For example, to easily get the <code>CREATE TABLE</code> statements for an SQLite database, you can do one of the following
            (similar methods exist for other databases):
          </p>
          <ul>
            <li>Run <code>sqlite3 &lt;database file&gt; .schema</code> in a terminal</li>
            <li>Execute the following query in a SQL client: <code>SELECT sql FROM sqlite_master WHERE type = 'table';</code></li>
          </ul>
          <p>Similar methods exist for other databases.</p>
          <p><strong>NOTE: Only provide the <code>CREATE TABLE</code> statements you are comfortable sending to OpenAI.</strong></p>
          <p>
            After you connect this database, you can create smaller groups of these tables in the NLQ-to-SQL sidebar as table "Contexts".
            This way, you can send a more limited subset of relevant <code>CREATE TABLE</code> statements to OpenAI to limit the cost of the request.
          </p>
          <vscode-text-area id="${constants.CREATE_TABLE_STATEMENTS_ELEMENT_ID}" rows="22" cols="70" placeholder="${constants.CREATE_TABLE_STATEMENTS_ELEMENT_PLACEHOLDER}">CREATE TABLE Statements (semicolon ";" separated)</vscode-text-area>
        </section>
        <p class="error-message" id="${constants.VALIDATION_MESSAGE_ELEMENT_ID}">All fields are required.</p>
        <vscode-button id="${constants.FORM_SUBMIT_BUTTON_ELEMENT_ID}">Add Database</vscode-button>
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
