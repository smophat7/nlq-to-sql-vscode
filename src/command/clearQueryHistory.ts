import * as vscode from "vscode";

import { DatabaseInfoManager } from "../database/DatabaseInfoManager";

/**
 * Clears the query history.
 *
 * @param databaseInfoManager
 */
export async function clearQueryHistory(
  databaseInfoManager: DatabaseInfoManager
) {
  await databaseInfoManager.clearQueryHistory();
  vscode.commands.executeCommand("nlq-to-sql.refreshQueryHistory");
}
