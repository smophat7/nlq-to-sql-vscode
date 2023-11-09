export const EXTENSION_ID = "nlq-to-sql";
export const EXTENSION_NAME = "NLQ-to-SQL";

// Tree view
export const DATABASE_ICON_CODE = "database";
export const TABLE_ICON_CODE = "window";
export const TABLE_GROUP_ICON_CODE = "server-environment";
export const FOLDER_ICON_CODE = "folder";
export const ACTIVE_TABLE_GROUP_ICON_CODE = "star-full";

// Webview
export const FORM_ELEMENT_ID = "addDatabaseForm";
export const DATABASE_NAME_ELEMENT_ID = "dbNameInput";
export const SQL_DIALENCT_ELEMENT_ID = "sqlDialectInput";
export const CREATE_TABLE_STATEMENTS_ELEMENT_ID = "createTableStatementsInput";
export const FORM_SUBMIT_BUTTON_ELEMENT_ID = "addDatabaseFormSubmitButton";
export const ADD_DATABASE_COMMAND_MESSAGE_CODE = "addDatabase";
export const CREATE_TABLE_STATEMENTS_ELEMENT_PLACEHOLDER = `CREATE TABLE movies (
  id INTEGER,
  title TEXT NOT NULL,
  release_year NUMERIC,
  PRIMARY KEY(id)
);

CREATE TABLE people (
  id INTEGER,
  name TEXT NOT NULL,
  birth_year NUMERIC,
  PRIMARY KEY(id)
);

CREATE TABLE stars (
  movie_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  FOREIGN KEY(movie_id) REFERENCES movies(id),
  FOREIGN KEY(person_id) REFERENCES people(id)
);`;
