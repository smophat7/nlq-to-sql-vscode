import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { DatabaseInfoManager } from "../database/DatabaseInfoManager";
import { TableInfo } from "../database/DatabaseInfo";
import { convertCreateStatementsToTableInfo } from "../database/convertCreateStatementsToTableInfo";
import { SettingsManager } from "../SettingsManager";

// TODO: use constants for error messages?
/**
 * Asks the user to select a database file and enter create statements for the database,
 * then adds the database to the workspace state, sets it as the active database, and refreshes the database explorer.
 *
 * @param databaseInfoManager
 */
export async function addDatabase(databaseInfoManager: DatabaseInfoManager) {
  const selectedDatabasePath = await getDatabaseUserSelection(
    databaseInfoManager
  );
  if (!selectedDatabasePath) {
    return;
  }

  const createStatementsUserInput = await getCreateStatementsUserInput();
  if (!createStatementsUserInput) {
    vscode.window.showErrorMessage("No create statements entered.");
    return;
  }

  let tableInfos: TableInfo[];
  try {
    tableInfos = convertCreateStatementsToTableInfo(createStatementsUserInput);
  } catch (error) {
    vscode.window.showErrorMessage(
      `Could not convert create statements to table info: ${error}`
    );
    return;
  }

  databaseInfoManager.addDatabase(selectedDatabasePath, tableInfos);

  vscode.commands.executeCommand("nlq-to-sql.refreshDatabaseExplorer");
  vscode.commands.executeCommand("nlq-to-sql.refreshActiveTableContext");
}

async function getDatabaseUserSelection(
  databaseInfoManager: DatabaseInfoManager
): Promise<string | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("No workspace folders found.");
    return;
  }
  const workspacePath = workspaceFolders[0].uri.fsPath;
  let databaseFileCandidatePaths = await findFilesInDirectory(workspacePath, [
    ".db",
    ".db3",
    ".sqlite",
    ".sqlite3",
    ".s3db",
    ".sl3",
  ]);
  console.log(databaseFileCandidatePaths);
  if (databaseFileCandidatePaths.length === 0) {
    vscode.window.showErrorMessage("No database files found in workspace.");
    return;
  }

  // remove any paths if they already exist in the extension context
  databaseFileCandidatePaths = databaseFileCandidatePaths.filter(
    (filePath) => !databaseInfoManager.getIfDatabaseExists(filePath)
  );
  if (databaseFileCandidatePaths.length === 0) {
    vscode.window.showErrorMessage(
      "No database files found in workspace that are not already added."
    );
    return;
  }

  const databasePath = await vscode.window.showQuickPick(
    databaseFileCandidatePaths.map((filePath) => ({
      label: path.basename(filePath),
      description: filePath,
    })),
    { placeHolder: "Select a database file" }
  );

  return databasePath?.description;
}

/**
 * Finds all files in a directory with the given extensions.
 *
 * @param directoryPath Base directory to search in.
 * @param extensions File extensions to search for.
 * @returns
 */
async function findFilesInDirectory(
  directoryPath: string,
  extensions: string[]
): Promise<string[]> {
  const files: string[] = [];
  const dirents = await fs.promises.readdir(directoryPath, {
    withFileTypes: true,
  });
  for (const dirent of dirents) {
    const direntPath = path.join(directoryPath, dirent.name);
    if (dirent.isDirectory()) {
      if (shouldExcludeDirectory(dirent.name)) {
        continue;
      }
      const nestedFiles = await findFilesInDirectory(direntPath, extensions);
      files.push(...nestedFiles);
    } else if (extensions.includes(path.extname(dirent.name))) {
      files.push(direntPath);
    }
  }
  return files;
}

/**
 * Returns true if the directory should be excluded from the search.
 *
 * @param directoryName Name of the directory to check.
 * @returns True if the directory should be excluded from the search.
 */
function shouldExcludeDirectory(directoryName: string): boolean {
  return SettingsManager.getExcludedDirectories().includes(directoryName);
}

/**
 * Asks the user to enter create statements for the database.
 *
 * @returns The single string of multiple create statements entered by the user.
 */
async function getCreateStatementsUserInput(): Promise<string | undefined> {
  const createStatementsUserInput = await vscode.window.showInputBox({
    prompt: "Enter create statements for the database",
    placeHolder: "CREATE TABLE ...",
    validateInput: (input) => {
      if (!input) {
        return "No create statements entered";
      }
      return "";
    },
  });
  return createStatementsUserInput;
}
