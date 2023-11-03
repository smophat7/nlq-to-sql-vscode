import { v4 as uuidv4 } from "uuid";

import { TableInfo } from "./DatabaseInfo";

/**
 * Separates a string of create statements into an array of TableInfo objects
 *
 * @param createTableStatementsUserInput Create statements as a string in the above format.
 * @returns TableInfo[].
 */
export function convertCreateStatementsToTableInfo(
  createTableStatementsUserInput: string
): TableInfo[] {
  let tableInfos: TableInfo[] = [];
  const createTableStatements = createTableStatementsUserInput.split(";");
  for (const createTableStatement of createTableStatements) {
    if (createTableStatement.trim() === "") {
      continue;
    }

    const tableName = getTableName(createTableStatement);

    tableInfos.push({
      tableId: uuidv4(),
      tableName: tableName,
      createTableStatement: createTableStatement,
      hidden: false,
    });
  }
  return tableInfos;
}

/**
 * Gets the table name from a create statement.
 * Removes database and schema names from table name (e.g., "myDatabase.mySchema.myTable" -> "myTable" and "[myDatabase].[mySchema].[myTable]" -> "[myTable]").
 * Removes quotes and brackets from table name (e.g., "[myTable]" -> "myTable").
 * Handles multi-line create statements.
 * Ignores various keywords (e.g., "REPLACE", "IF", "NOT", "EXISTS", "LOCAL") to focus on "CREATE TABLE <tableName>".
 *
 * @param createTableStatement The SQL CREATE TABLE statement.
 * @returns The table name.
 */
export function getTableName(createTableStatement: string): string {
  if (!createTableStatement) {
    throw new Error("Create statement cannot be empty");
  }

  const normalizedStatement = createTableStatement.replace(/\n/g, " ");
  const keywords = [
    "OR",
    "REPLACE",
    "IF",
    "NOT",
    "EXISTS",
    "LOCAL",
    "GLOBAL",
    "TEMP",
    "TEMPORARY",
    "VOLATILE",
    "TRANSIENT",
  ];
  const statementParts = normalizedStatement
    .split(" ")
    .filter((part) => part && !keywords.includes(part.toUpperCase()));

  if (
    statementParts.length < 2 ||
    statementParts[0].toUpperCase() !== "CREATE" ||
    statementParts[1].toUpperCase() !== "TABLE"
  ) {
    throw new Error(`Invalid create statement:\n${createTableStatement}`);
  }

  let tableName = statementParts[2];
  if (!tableName) {
    throw new Error(
      `Table name not found in create statement:\n${createTableStatement}`
    );
  }

  // Remove database and schema names from table name (e.g., "myDatabase.mySchema.myTable" -> "myTable" and "[myDatabase].[mySchema].[myTable]" -> "[myTable]")
  if (tableName.includes(".")) {
    tableName = tableName.split(".").pop() || "";
  }

  // Remove quotes and brackets from table name (e.g., "[myTable]" -> "myTable")
  tableName = tableName.replace(/["\[\]]/g, "");

  return tableName;
}
