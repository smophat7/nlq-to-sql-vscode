/**
 * Database information for the extension context.
 */
export type DatabaseInfo = {
  databaseId: string;
  name: string;
  path: string;
  activeContext?: string;
  tables: TableInfo[];
  tableContexts: TableContextInfo[]; // TODO: Use map?
};

/**
 * Database table information for the extension context.
 */
export interface TableInfo {
  tableId: string;
  tableName: string;
  createStatement: string;
  attributes: AttributeInfo[];
  hidden: boolean;
}

/**
 * Database table attribute information for the extension context.
 */
export interface AttributeInfo {
  attributeName: string;
  attributeType: string;
}

/**
 * Database table context information for the extension context.
 * To be used for creating groups/contexts/environments of tables to use as the basis for NLQ-to-SQL queries.
 */
export interface TableContextInfo {
  tableContextId: string;
  tableContextName: string;
  tableIds: string[];
}

/**
 * Query information for the extension context.
 * To be used for storing generated query history.
 */
export interface QueryInfo {
  queryId: string;
  query: string;
  dateUtc: Date;
}
