import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import {
  DatabaseInfo,
  QueryInfo,
  TableInfo,
  TableGroupInfo,
} from "./DatabaseInfo";
import path = require("path");

export class DatabaseInfoManager {
  private static readonly activeDatabaseIdKey = "activeDatabaseId";
  private static readonly databasesKey = "databases";
  private static readonly queryHistoryKey = "queryHistory";

  private readonly workspaceState: vscode.Memento;

  constructor(workspaceState: vscode.Memento) {
    this.workspaceState = workspaceState;
  }

  public get activeDatabaseId(): string | undefined {
    return this.workspaceState.get(DatabaseInfoManager.activeDatabaseIdKey);
  }

  public set activeDatabaseId(databaseId: string | undefined) {
    this.workspaceState.update(
      DatabaseInfoManager.activeDatabaseIdKey,
      databaseId
    );
  }

  public get databases(): Map<string, DatabaseInfo> | undefined {
    const databasesArray: [string, DatabaseInfo][] | undefined =
      this.workspaceState.get(DatabaseInfoManager.databasesKey);
    return databasesArray
      ? new Map<string, DatabaseInfo>(databasesArray)
      : undefined;
  }

  public set databases(databases: Map<string, DatabaseInfo> | null) {
    let databasesArray = undefined;
    if (databases) {
      databasesArray = Array.from(databases.entries());
    }
    this.workspaceState
      .update(DatabaseInfoManager.databasesKey, databasesArray)
      .then(() => {
        console.log("Workspace databases set successfully");
      });
  }

  public get queryHistory(): Map<string, QueryInfo> | undefined {
    return (
      (this.workspaceState.get(DatabaseInfoManager.queryHistoryKey) as Map<
        string,
        QueryInfo
      >) || undefined
    );
  }

  public set queryHistory(queryHistory: Map<string, QueryInfo> | null) {
    this.workspaceState.update(
      DatabaseInfoManager.queryHistoryKey,
      queryHistory ? Array.from(queryHistory.entries()) : undefined
    );
  }

  /**
   * Adds a database to the workspace state and sets it as the active database.
   *
   * @param filePath The path to the database file.
   * @param tables Information about the tables in the database. Converted to TableInfo.
   */
  public addDatabase(filePath: string, tables: TableInfo[]): void {
    const tableGroup: TableGroupInfo = {
      tableGroupId: uuidv4(),
      tableGroupName: "All Tables",
      tableIds: tables.map((table) => table.tableId),
    };

    const database: DatabaseInfo = {
      databaseId: uuidv4(),
      path: filePath,
      name: path.basename(filePath),
      activeGroupId: tableGroup.tableGroupId,
      tables: tables,
      tableGroups: [tableGroup],
    };

    let databaseMap = this.databases;
    if (!databaseMap) {
      databaseMap = new Map<string, DatabaseInfo>();
    }
    databaseMap.set(database.databaseId, database);
    this.databases = databaseMap;
    this.activeDatabaseId = database.databaseId;
  }

  /**
   * Removes a database from the workspace state.
   * If the database is the active database, the active database is set to undefined.
   *
   * @param databaseId The id of the database to remove.
   */
  public removeDatabase(databaseId: string) {
    let databaseMap = this.databases;
    if (!databaseMap) {
      vscode.window.showErrorMessage(
        "Error: No databases found in workspace state."
      );
      return;
    }
    const ifExisted = databaseMap.delete(databaseId);
    if (!ifExisted) {
      vscode.window.showErrorMessage(
        `Error: Could not find database with id ${databaseId}.`
      );
      return;
    }

    this.databases = databaseMap;
    if (this.activeDatabaseId === databaseId) {
      this.activeDatabaseId = undefined;
    }

    vscode.window.showInformationMessage(
      `Removed database with id ${databaseId}.`
    );
  }

  /**
   * Returns true if the database exists in the workspace state records based on the path.
   *
   * @param selectedDatabasePath
   * @returns
   */
  getIfDatabaseExists(selectedDatabasePath: string): boolean {
    if (!this.databases) {
      return false;
    }
    const databases = Array.from(this.databases.values());
    const databaseIndex = databases.findIndex(
      (database) => database.path === selectedDatabasePath
    );
    return databaseIndex !== -1;
  }

  /**
   * Returns one string of all the active database's active table group's CREATE statements.
   * Throws an error if there is no active database, active group, or tables in the active group.
   * TODO: Make more fault tolerant.
   */
  getActiveGroupSchema(): string {
    if (!this.activeDatabaseId) {
      throw new Error("No active database.");
    }
    if (!this.databases) {
      throw new Error("No databases found in workspace state.");
    }
    const activeDatabase: DatabaseInfo | undefined = this.databases.get(
      this.activeDatabaseId
    );
    if (!activeDatabase) {
      throw new Error(
        "No active database found by workspace state's activeDatabaseId."
      );
    }
    const activeGroupId = activeDatabase.activeGroupId;
    if (!activeGroupId) {
      throw new Error("No active group.");
    }
    const activeGroup: TableGroupInfo | undefined =
      activeDatabase.tableGroups.find(
        (group: TableGroupInfo) => group.tableGroupId === activeGroupId
      );
    if (!activeGroup) {
      throw new Error(
        `No active group tables found in database with id ${activeDatabase.databaseId} and activeGroupId ${activeGroupId}.`
      );
    }

    const activeGroupTables: TableInfo[] = activeGroup.tableIds.map(
      (tableId) => {
        const table = activeDatabase.tables.find(
          (table) => table.tableId === tableId
        );
        if (!table) {
          throw new Error(
            `No table found in database with id ${activeDatabase.databaseId} and tableId ${tableId}.`
          );
        }
        return table;
      }
    );

    if (activeGroupTables.length === 0) {
      throw new Error(
        `No tables found in active group with id ${activeGroupId}.`
      );
    }

    let schema = "";
    activeGroupTables.forEach((table) => {
      schema += `${table.createStatement}\n`;
    });
    return schema;
  }
}
