import * as vscode from "vscode";
import { DatabaseContextProvider } from "./database/DatabaseContextProvider";
import { generateSql } from "./command/generateSql";

export function activate(context: vscode.ExtensionContext) {
  let generateSqlCommand = vscode.commands.registerCommand(
    "nlq-to-sql.generateSql",
    () => {
      vscode.window.showInformationMessage("Generate!");
      generateSql();
    }
  );

  context.subscriptions.push(generateSqlCommand);
}

export function deactivate() {}
