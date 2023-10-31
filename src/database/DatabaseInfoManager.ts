import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import {
  DatabaseInfo,
  QueryInfo,
  TableInfo,
  TableGroupInfo,
} from "./DatabaseInfo";
import path = require("path");

/**
 * Manages stored database information for the extension workspace state.
 */
export class DatabaseInfoManager {
  private static readonly activeDatabaseIdKey = "activeDatabaseId";
  private static readonly databasesKey = "databases";
  private static readonly queryHistoryKey = "queryHistory";
  private readonly workspaceState: vscode.Memento;

  constructor(workspaceState: vscode.Memento) {
    this.workspaceState = workspaceState;
  }

  /**
   * The id of the active database.
   * The active database is the database that is currently selected in the database explorer tree view.
   * The active database is used as the basis for NLQ-to-SQL queries.
   */
  public get activeDatabaseId(): string | undefined {
    return this.workspaceState.get(DatabaseInfoManager.activeDatabaseIdKey);
  }

  public set activeDatabaseId(databaseId: string | undefined) {
    this.workspaceState.update(
      DatabaseInfoManager.activeDatabaseIdKey,
      databaseId
    );
  }

  /**
   * The map of database ids to database information.
   */
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

  /**
   * The map of query ids to query information. Used for storing generated query history.
   */
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
  public getIfDatabaseExists(selectedDatabasePath: string): boolean {
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
   * Sets the active database and the active table group of that database.
   * Throws an error if the database or table group does not exist.
   *
   * @param tableGroupId The id of the table group to set as active.
   * @param databaseId The id of the database to set as active.
   */
  async setActiveTableGroupAndDatabase(
    tableGroupId: string,
    databaseId: string
  ): Promise<void> {
    const databaseMap = this.databases;
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    const database = databaseMap.get(databaseId);
    if (!database) {
      throw new Error(
        `No database found in workspace state with id ${databaseId}.`
      );
    }
    const tableGroup = database.tableGroups.find(
      (group) => group.tableGroupId === tableGroupId
    );
    if (!tableGroup) {
      throw new Error(
        `No table group found in database with id ${databaseId} and tableGroupId ${tableGroupId}.`
      );
    }

    database.activeGroupId = tableGroup.tableGroupId;
    databaseMap.set(databaseId, database);
    this.databases = databaseMap;
    this.activeDatabaseId = databaseId;
  }

  /**
   * Returns the id of the database that contains the table group with the given id.
   *
   * @param tableGroupId The id of the table group.
   * @returns The id of the database that contains the table group with the given id or undefined if no database contains the table group or no databases exist.
   */
  getDatabaseIdByTableGroupId(tableGroupId: string): string | undefined {
    const databaseMap = this.databases;
    if (!databaseMap) {
      return;
    }
    for (const database of databaseMap.values()) {
      for (const tableGroup of database.tableGroups) {
        if (tableGroup.tableGroupId === tableGroupId) {
          return database.databaseId;
        }
      }
    }
    return;
  }

  /**
   * Gets the table information for the table with the given id in the database with the given id.
   *
   * @param tableId The id of the table.
   * @param activeDatabaseId The id of the database.
   */
  getTableInfo(tableId: any, activeDatabaseId: string): TableInfo {
    const databaseMap = this.databases;
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    const database = databaseMap.get(activeDatabaseId);
    if (!database) {
      throw new Error(
        `No database found in workspace state with id ${activeDatabaseId}.`
      );
    }
    const table = database.tables.find((table) => table.tableId === tableId);
    if (!table) {
      throw new Error(
        `No table found in database with id ${activeDatabaseId} and tableId ${tableId}.`
      );
    }
    return table;
  }

  /**
   * Gets the table group information for the active table group of the database with the given id.
   *
   * @param databaseId The id of the database.
   */
  getActiveTableGroupInfo(databaseId: string): TableGroupInfo {
    const databaseMap = this.databases;
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    const database = databaseMap.get(databaseId);
    if (!database) {
      throw new Error(
        `No database found in workspace state with id ${databaseId}.`
      );
    }
    const tableGroup = database.tableGroups.find(
      (tableGroup) => tableGroup.tableGroupId === database.activeGroupId
    );
    if (!tableGroup) {
      throw new Error(
        `No active table group found in database with id ${databaseId}.`
      );
    }
    return tableGroup;
  }

  /**
   * Returns one string of all the active database's active table group's CREATE statements.
   * Throws an error if there is no active database, active group, or tables in the active group.
   * TODO: Make more fault tolerant.
   */
  public getActiveGroupSchema(): string {
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
