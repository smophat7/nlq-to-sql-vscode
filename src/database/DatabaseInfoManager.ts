import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import {
  DatabaseInfo,
  QueryInfo,
  TableInfo,
  TableContextInfo,
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
  public getActiveDatabaseId(): string | undefined {
    return this.workspaceState.get(DatabaseInfoManager.activeDatabaseIdKey);
  }

  public async setActiveDatabaseId(databaseId: string | undefined) {
    await this.workspaceState.update(
      DatabaseInfoManager.activeDatabaseIdKey,
      databaseId
    );
  }

  /**
   * The map of database ids to database information.
   */
  public getDatabases(): Map<string, DatabaseInfo> | undefined {
    const databasesArray: [string, DatabaseInfo][] | undefined =
      this.workspaceState.get(DatabaseInfoManager.databasesKey);
    return databasesArray
      ? new Map<string, DatabaseInfo>(databasesArray)
      : undefined;
  }

  public async setDatabases(databases: Map<string, DatabaseInfo> | null) {
    let databasesArray = undefined;
    if (databases) {
      databasesArray = Array.from(databases.entries());
    }
    await this.workspaceState.update(
      DatabaseInfoManager.databasesKey,
      databasesArray
    );
  }

  /**
   * The map of query ids to query information. Used for storing generated query history.
   */
  public getQueryHistory(): Map<string, QueryInfo> | undefined {
    const queryHistoryArray: [string, QueryInfo][] | undefined =
      this.workspaceState.get(DatabaseInfoManager.queryHistoryKey);
    return queryHistoryArray
      ? new Map<string, QueryInfo>(queryHistoryArray)
      : undefined;
  }

  public async setQueryHistory(queryHistory: Map<string, QueryInfo> | null) {
    this.workspaceState.update(
      DatabaseInfoManager.queryHistoryKey,
      queryHistory ? Array.from(queryHistory.entries()) : undefined
    );
  }

  /**
   * Adds a database to the workspace state and sets it as the active database.
   *
   * @param name The name of the database.
   * @param tables Information about the tables in the database. Converted to TableInfo.
   * @param dialect The SQL dialect of the database.
   * @returns True if the database was added successfully, false otherwise.
   */
  public async addDatabase(
    name: string,
    dialect: string,
    tables: TableInfo[]
  ): Promise<boolean> {
    let databaseMap = this.getDatabases();
    if (!databaseMap) {
      databaseMap = new Map<string, DatabaseInfo>();
    }
    for (const database of databaseMap.values()) {
      if (database.name === name) {
        vscode.window.showErrorMessage(
          `A database with the name ${name} already exists.`
        );
        return false;
      }
    }

    const tableContext: TableContextInfo = {
      tableContextId: uuidv4(),
      tableContextName: "All Tables",
      tableIds: tables.map((table) => table.tableId),
    };

    const database: DatabaseInfo = {
      databaseId: uuidv4(),
      name: name,
      activeContext: tableContext.tableContextId,
      tables: tables,
      dialect: dialect,
      tableContexts: [tableContext],
    };

    databaseMap.set(database.databaseId, database);
    await this.setDatabases(databaseMap);
    await this.setActiveDatabaseId(database.databaseId);
    return true;
  }

  /**
   * Updates the database in the workspace state.
   * Throws an error if the database does not exist or if there are no databases in the workspace state.
   *
   * @param database The database to update.
   */
  async updateDatabase(database: DatabaseInfo) {
    let databaseMap = this.getDatabases();
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    if (!databaseMap.has(database.databaseId)) {
      throw new Error(
        `No database found in workspace state with id ${database.databaseId}.`
      );
    }
    databaseMap.set(database.databaseId, database);
    await this.setDatabases(databaseMap);
  }

  /**
   * Removes a database from the workspace state.
   * If the database is the active database, the active database is set to undefined.
   *
   * @param databaseId The id of the database to remove.
   */
  public async removeDatabase(databaseId: string) {
    let databaseMap = this.getDatabases();
    if (!databaseMap) {
      vscode.window.showErrorMessage("No databases found in workspace state.");
      return;
    }
    const ifExisted = databaseMap.delete(databaseId);
    if (!ifExisted) {
      vscode.window.showErrorMessage(
        `Could not find database with id ${databaseId}.`
      );
      return;
    }

    await this.setDatabases(databaseMap);
    if (this.getActiveDatabaseId() === databaseId) {
      await this.setActiveDatabaseId(undefined);
    }

    vscode.window.showInformationMessage(
      `Removed database with id ${databaseId}.`
    );
  }

  /**
   * Sets the active database and the active table context of that database.
   * Throws an error if the database or table context does not exist.
   *
   * @param tableContextId The id of the table context to set as active.
   * @param databaseId The id of the database to set as active.
   */
  async setActiveTableContextAndDatabase(
    tableContextId: string,
    databaseId: string
  ): Promise<void> {
    const databaseMap = this.getDatabases();
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    const database = databaseMap.get(databaseId);
    if (!database) {
      throw new Error(
        `No database found in workspace state with id ${databaseId}.`
      );
    }
    const tableContext = database.tableContexts.find(
      (group) => group.tableContextId === tableContextId
    );
    if (!tableContext) {
      throw new Error(
        `No table context found in database with id ${databaseId} and tableContextId ${tableContextId}.`
      );
    }

    database.activeContext = tableContext.tableContextId;
    databaseMap.set(databaseId, database);
    await this.setDatabases(databaseMap);
    await this.setActiveDatabaseId(databaseId);
  }

  /**
   * Returns the id of the database that contains the table context with the given id.
   *
   * @param tableContextId The id of the table context.
   * @returns The id of the database that contains the table context with the given id or undefined if no database contains the table context or no databases exist.
   */
  getDatabaseIdByTableContextId(tableContextId: string): string | undefined {
    const databaseMap = this.getDatabases();
    if (!databaseMap) {
      return;
    }
    for (const database of databaseMap.values()) {
      for (const tableContext of database.tableContexts) {
        if (tableContext.tableContextId === tableContextId) {
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
    const databaseMap = this.getDatabases();
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
   * Gets the table context information for the active table context of the database with the given id.
   * Returns undfined if the database does not exist or if there is no active table context.
   *
   * @param databaseId The id of the database.
   * @returns The table context information for the active table context of the database with the given id.
   */
  getActiveTableContextInfo(databaseId: string): TableContextInfo | undefined {
    const databaseMap = this.getDatabases();
    if (!databaseMap) {
      return;
    }
    const database = databaseMap.get(databaseId);
    if (!database) {
      return;
    }
    return database.tableContexts.find(
      (tableContext) => tableContext.tableContextId === database.activeContext
    );
  }

  /**
   * Adds a table context to the database with the given id.
   *
   * @param databaseId The id of the database to add the table context to.
   * @param name The name of the table context.
   */
  async addTableContext(databaseId: string, name: string) {
    const databaseMap = this.getDatabases();
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    const database = databaseMap.get(databaseId);
    if (!database) {
      throw new Error(
        `No database found in workspace state with id ${databaseId}.`
      );
    }

    const tableContext: TableContextInfo = {
      tableContextId: uuidv4(),
      tableContextName: name,
      tableIds: [],
    };
    database.tableContexts.push(tableContext);
    databaseMap.set(databaseId, database);
    await this.setDatabases(databaseMap);
  }

  /**
   * Removes a table context from the workspace state.
   * Throws an error if the table context does not exist or if there are no databases in the workspace state.
   * If the table context is the active table context, the active table context is set to undefined.
   *
   * @param tableContextId The id of the table context to remove.
   */
  async removeTableContext(tableContextId: string) {
    const databaseMap = this.getDatabases();
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    const databaseId = this.getDatabaseIdByTableContextId(tableContextId);
    if (!databaseId) {
      throw new Error(
        `No database found in workspace state with a table context with id ${tableContextId}.`
      );
    }
    const database = databaseMap.get(databaseId);
    if (!database) {
      throw new Error(
        `No database found in workspace state with id ${databaseId}.`
      );
    }

    const tableContextIndex = database.tableContexts.findIndex(
      (tableContext) => tableContext.tableContextId === tableContextId
    );
    if (tableContextIndex === -1) {
      throw new Error(
        `No table context found in database with id ${databaseId} and tableContextId ${tableContextId}.`
      );
    }

    database.tableContexts.splice(tableContextIndex, 1);

    database.activeContext = undefined;
    databaseMap.set(databaseId, database);
    await this.setDatabases(databaseMap);
  }

  /**
   * Adds a query to the query history.
   *
   * @param query The query to add to the query history.
   */
  async addQueryToHistory(query: string) {
    let queryHistory = this.getQueryHistory();
    if (!queryHistory) {
      queryHistory = new Map<string, QueryInfo>();
    }

    const queryInfo: QueryInfo = {
      queryId: uuidv4(),
      query: query,
      dateUtc: new Date(),
    };

    queryHistory.set(queryInfo.queryId, queryInfo);
    await this.setQueryHistory(queryHistory);
  }

  /**
   * Gets the query information for the query with the given id.
   *
   * @param queryId The id of the query.
   * @returns The query information for the query with the given id.
   * @throws An error if the query does not exist in the query history or if there is no query history.
   */
  getQueryInfo(queryId: string) {
    const queryHistory = this.getQueryHistory();
    if (!queryHistory) {
      throw new Error("No query history found in workspace state.");
    }
    const queryInfo = queryHistory.get(queryId);
    if (!queryInfo) {
      throw new Error(
        `No query found in query history with id ${queryId}. Query history: ${JSON.stringify(
          queryHistory
        )}`
      );
    }
    return queryInfo;
  }

  /**
   * Removes a query from the query history.
   *
   * @param queryId The id of the query to remove from the query history.
   * @throws An error if the query does not exist in the query history or if there is no query history.
   */
  async removeQueryFromHistory(queryId: string) {
    let queryHistory = this.getQueryHistory();
    if (!queryHistory) {
      throw new Error("No query history found in workspace state.");
    }
    const ifExisted = queryHistory.delete(queryId);
    if (!ifExisted) {
      throw new Error(`No query found in query history with id ${queryId}.`);
    }

    await this.setQueryHistory(queryHistory);
  }

  /**
   * Clears the query history.
   */
  async clearQueryHistory() {
    await this.setQueryHistory(new Map<string, QueryInfo>());
  }

  /**
   * Returns the SQL dialect of the active table context.
   */
  public getActiveGroupSqlDialect(): string {
    const activeDatabaseId = this.getActiveDatabaseId();
    if (!activeDatabaseId) {
      throw new Error("No active database.");
    }
    const databaseMap = this.getDatabases();
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    const activeDatabase: DatabaseInfo | undefined =
      databaseMap.get(activeDatabaseId);
    if (!activeDatabase) {
      throw new Error(
        "No active database found by workspace state's activeDatabaseId."
      );
    }

    return activeDatabase.dialect;
  }

  /**
   * Returns one string of all the active database's active table context's CREATE statements.
   * Throws an error if there is no active database, active group, or tables in the active group.
   * TODO: Make more fault tolerant.
   */
  public getActiveGroupSchema(): string {
    const activeDatabaseId = this.getActiveDatabaseId();
    if (!activeDatabaseId) {
      throw new Error("No active database.");
    }
    const databaseMap = this.getDatabases();
    if (!databaseMap) {
      throw new Error("No databases found in workspace state.");
    }
    const activeDatabase: DatabaseInfo | undefined =
      databaseMap.get(activeDatabaseId);
    if (!activeDatabase) {
      throw new Error(
        "No active database found by workspace state's activeDatabaseId."
      );
    }
    const activeContext = activeDatabase.activeContext;
    if (!activeContext) {
      throw new Error("No active group.");
    }
    const activeGroup: TableContextInfo | undefined =
      activeDatabase.tableContexts.find(
        (group: TableContextInfo) => group.tableContextId === activeContext
      );
    if (!activeGroup) {
      throw new Error(
        `No active group tables found in database with id ${activeDatabase.databaseId} and activeContext ${activeContext}.`
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
        `No tables found in active group with id ${activeContext}.`
      );
    }

    let schema = "";
    activeGroupTables.forEach((table) => {
      schema += `${table.createTableStatement}\n`;
    });
    return schema;
  }
}
