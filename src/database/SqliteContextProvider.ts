import * as vscode from "vscode";
import * as sqlite from "better-sqlite3";
import { DatabaseContextProvider } from "./DatabaseContextProvider";

export class SqliteContextProvider implements DatabaseContextProvider {
  private db: sqlite.Database | undefined;
  private dbFilePath: string;

  constructor(dbFilePath: string) {
    this.dbFilePath = dbFilePath;
  }

  async openConnection(): Promise<void> {
    if (!this.db) {
      this.db = new sqlite(this.dbFilePath);
    }
  }

  closeConnection(): void {
    if (!this.db) {
      return;
    }
    this.db.close();
  }

  async getSchema(): Promise<string> {
    if (!this.db) {
      throw new Error("Database connection is not open.");
    }
    // const result = await this.db.get("SELECT * FROM sqlite_master");
    // return JSON.stringify(result);
    return "";
  }

  async getSampleData(): Promise<string> {
    if (!this.db) {
      throw new Error("Database connection is not open.");
    }
    // const result = await this.db.get("SELECT * FROM sample_table");
    // return JSON.stringify(result);
    return "";
  }
}
