import * as vscode from "vscode";
import * as fs from "fs";
import { addDatabase } from "../../database/addDatabase";
import { DatabaseInfoManager } from "../../database/DatabaseInfoManager";

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
      "Add Database",
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
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
          case "addDatabase":
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

  // Send a "refactor" message to the webview (can be any JSON serialiazable data)
  public doRefactor() {
    this._panel.webview.postMessage({ command: "refactor" }); // TODO: Get rid of this or use it
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
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.js")
    );
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "main.css")
    );
    const nonce = getNonce(); // To only allow specific scripts to be run

    const bodyHtmlUri = vscode.Uri.joinPath(
      this._extensionUri,
      "src",
      "view",
      "webview",
      "AddDatabasePanelBody.html"
    ); // TODO: Anything but this
    const bodyHtml = fs.readFileSync(bodyHtmlUri.fsPath, "utf8");
    return `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />

          <!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
          <meta
            http-equiv="Content-Security-Policy"
            content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';"
          />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <link href="${stylesUri}" rel="stylesheet" />

          <title>Add Database</title>
        </head>
        <body>
          ${bodyHtml}
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
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
    localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")], // Restrict the webview to only loading content from our extension's `media` directory.
  };
}
