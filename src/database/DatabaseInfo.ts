export type DatabaseInfo = {
  databaseId: string;
  name: string;
  path: string;
  activeGroupId?: string;
  tables: TableInfo[];
  tableGroups: TableGroupInfo[];
};

export interface TableInfo {
  tableId: string;
  tableName: string;
  createStatement: string;
  attributes: AttributeInfo[];
  hidden: boolean;
}

export interface TableInfoInput {
  tableId: string;
  tableName: string;
  createStatement: string;
  tableAttributes: AttributeInfo[];
}

export interface AttributeInfo {
  attributeName: string;
  attributeType: string;
}

export interface TableGroupInfo {
  tableGroupId: string;
  tableGroupName: string;
  tableIds: string[];
}

export interface QueryInfo {
  queryId: string;
  query: string;
}
