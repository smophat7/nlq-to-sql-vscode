import { v4 as uuidv4 } from "uuid";

import { AttributeInfo, TableInfo } from "./DatabaseInfo";

/**
 * Converts a string of create statements to TableInfo[]. Supports the following SQLite format:
    CREATE TABLE directors (
      movie_id INTEGER NOT NULL,
      person_id INTEGER NOT NULL,
      FOREIGN KEY(movie_id) REFERENCES movies(id),
      FOREIGN KEY(person_id) REFERENCES people(id)
  );
 * 
 * @param createStatementsUserInput Create statements as a string in the above format.
 * @returns TableInfo[].
 */
export function convertCreateStatementsToTableInfo(
  createStatementsUserInput: string
): TableInfo[] {
  var parser = require("sqlite-parser");

  let tableInfos: TableInfo[] = [];
  const createStatements = createStatementsUserInput.split(";");
  for (const createStatement of createStatements) {
    if (createStatement.trim() === "") {
      continue;
    }

    const sqlAst: any = parser(createStatement);
    if (sqlAst.type !== "statement" || sqlAst.variant !== "list") {
      throw new Error(
        `AST type was not "statement" or variant was not "list". AST: ${sqlAst}`
      );
    }
    if (sqlAst.statement.length !== 1) {
      throw new Error(
        `AST statement length was not 1 (it is split on ";" before parsing). Statement: ${sqlAst.statement}`
      );
    }

    for (const statement of sqlAst.statement) {
      let tableName: string;
      if (statement.type !== "statement" || statement.variant !== "create") {
        throw new Error(
          `AST statement type was not "create". Statement: ${statement}`
        );
      }
      if (
        statement.name.type !== "identifier" ||
        statement.name.variant !== "table"
      ) {
        throw new Error(
          `AST statement name type was not "identifier" or variant was not "table". Statement: ${statement}`
        );
      }

      tableName = statement.name.name;
      let attributes: AttributeInfo[] = [];
      for (const definition of statement.definition) {
        if (definition.type !== "definition") {
          throw new Error(
            `AST definition type was not "definition". Definition: ${definition}`
          );
        }
        if (definition.variant === "column") {
          const attributeInfo: AttributeInfo = {
            attributeName: definition.name,
            attributeType: definition.datatype.variant, // TODO: or use definition.datatype.affinity?
          };
          attributes.push(attributeInfo);
        }
      }

      tableInfos.push({
        tableId: uuidv4(),
        tableName: tableName,
        createStatement: createStatement,
        attributes: attributes,
        hidden: false,
      });
    }
  }
  return tableInfos;
}

// /**
//  * DO NOT USE: Converts a string of create statements to TableInfo[]. Supports the following format:
//     CREATE TABLE directors (
//       movie_id INTEGER NOT NULL,
//       person_id INTEGER NOT NULL,
//       FOREIGN KEY(movie_id) REFERENCES movies(id),
//       FOREIGN KEY(person_id) REFERENCES people(id)
//   );
//  *
//  * @param createStatementsUserInput Create statements as a string in the above format.
//  * @returns TableInfo[].
//  */
// export function convertCreateStatementsToTableInfo(
//   createStatementsUserInput: string
// ): TableInfo[] {
//   const { Parser } = require("node-sql-parser");
//   const opt = {
//     database: "SQLite",
//   };

//   let tableInfos: TableInfo[] = [];
//   const createStatements = createStatementsUserInput.split(";");
//   for (const createStatement of createStatements) {
//     if (createStatement.trim() === "") {
//       continue;
//     }

//     let sqlAst;
//     try {
//       sqlAst = new Parser().astify(createStatement, opt)[0];
//       const attributes: AttributeInfo[] = [];
//       for (const definition of sqlAst.create_definitions) {
//         if (definition.resource === "column") {
//           const attributeInfo: AttributeInfo = {
//             attributeName: definition.column.column,
//             attributeType: definition.definition.dataType,
//           };
//           attributes.push(attributeInfo);
//         }
//       }

//       const tableInfoInput: TableInfo = {
//         tableId: uuidv4(),
//         tableName: sqlAst.table[0].table,
//         createStatement: createStatement,
//         attributes: attributes,
//         hidden: false,
//       };
//       tableInfos.push(tableInfoInput);
//     } catch (error) {
//       vscode.window.showErrorMessage(
//         `Error parsing the provided SQL CREATE statements. Specific error: ${error}`
//       );
//     }
//   }

//   return tableInfos;
// }
