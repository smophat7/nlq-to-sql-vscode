import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeTextArea,
  vsCodeTextField,
  TextField,
  Button,
  TextArea,
} from "@vscode/webview-ui-toolkit";
import {
  FORM_ELEMENT_ID,
  DATABASE_NAME_ELEMENT_ID,
  SQL_DIALENCT_ELEMENT_ID,
  CREATE_TABLE_STATEMENTS_ELEMENT_ID,
  ADD_DATABASE_COMMAND_MESSAGE_CODE,
  FORM_SUBMIT_BUTTON_ELEMENT_ID,
} from "../constants";

// Provide limited VS Code API to the webview
const vscode = acquireVsCodeApi();

// Register webview-ui-toolkit components
provideVSCodeDesignSystem().register(
  vsCodeButton(),
  vsCodeTextArea(),
  vsCodeTextField()
);

// Like regular webpages: wait for webview DOM content to load before referencing HTML elements or toolkit components
window.addEventListener("DOMContentLoaded", main);

/**
 * Main function. Called when the webview DOM content is loaded.
 */
function main() {
  restoreState();

  const formElements = getFormElements();
  formElements.dbNameInput.addEventListener("input", () =>
    saveState(formElements)
  );
  formElements.sqlDialectInput.addEventListener("input", () =>
    saveState(formElements)
  );
  formElements.createTableStatementsInput.addEventListener("input", () =>
    saveState(formElements)
  );

  // There is a known bug where a <vscode-button> element inside a <form> does not trigger
  // the form's submit event when clicked. Until that's fixed, we'll call it manually.
  // See the issue at https://github.com/microsoft/vscode-webview-ui-toolkit/issues/395
  const button = document.getElementById(
    FORM_SUBMIT_BUTTON_ELEMENT_ID
  ) as Button;
  button.addEventListener("click", (event) => {
    console.log("button clicked"); // TODO: DELETE ME
    event.preventDefault();
    handleFormSubmit(formElements);
  });
}

/**
 * Restore the state of the form from the previous session if it exists when the webview is loaded.
 */
function restoreState() {
  const oldState: FormState | undefined = vscode.getState() as FormState;
  if (oldState) {
    const { dbNameInput, sqlDialectInput, createTableStatementsInput } =
      getFormElements();

    dbNameInput.value = oldState.dbName;
    sqlDialectInput.value = oldState.sqlDialect;
    createTableStatementsInput.value = oldState.createTableStatements;
  }
}

/**
 * Save the state of the form so that it can be restored when the webview is reloaded.
 *
 * @param formElements The elements of the form to save the state of.
 */
function saveState(formElements: FormElements) {
  vscode.setState({
    dbName: formElements.dbNameInput.value,
    sqlDialect: formElements.sqlDialectInput.value,
    createTableStatements: formElements.createTableStatementsInput.value,
  } as FormState);
}

/**
 * Handle the form submission by sending a message to the extension with the form data.
 *
 * @param formElements The elements of the form to get the data from.
 */
function handleFormSubmit(formElements: FormElements) {
  {
    console.log("handling event 1"); // TODO: DELETE ME

    vscode.postMessage({
      command: ADD_DATABASE_COMMAND_MESSAGE_CODE,
      dbName: formElements.dbNameInput.value,
      sqlDialect: formElements.sqlDialectInput.value,
      createTableStatements: formElements.createTableStatementsInput.value,
    });
  }
}

/**
 * Get the elements of the form.
 *
 * @returns The elements of the form.
 */
function getFormElements(): FormElements {
  const dbNameInput = document.getElementById(
    DATABASE_NAME_ELEMENT_ID
  ) as TextField;
  const sqlDialectInput = document.getElementById(
    SQL_DIALENCT_ELEMENT_ID
  ) as TextField;
  const createTableStatementsInput = document.getElementById(
    CREATE_TABLE_STATEMENTS_ELEMENT_ID
  ) as TextArea;

  if (!dbNameInput) {
    throw new Error(`Input with id ${DATABASE_NAME_ELEMENT_ID} not found`);
  }
  if (!sqlDialectInput) {
    throw new Error(`Input with id ${SQL_DIALENCT_ELEMENT_ID} not found`);
  }
  if (!createTableStatementsInput) {
    throw new Error(
      `Input with id ${CREATE_TABLE_STATEMENTS_ELEMENT_ID} not found`
    );
  }
  return {
    dbNameInput: dbNameInput,
    sqlDialectInput: sqlDialectInput,
    createTableStatementsInput: createTableStatementsInput,
  } as FormElements;
}

/**
 * The HTML elements of the form.
 */
interface FormElements {
  dbNameInput: TextField;
  sqlDialectInput: TextField;
  createTableStatementsInput: TextArea;
}

/**
 * The state of the form. Values of the form elements.
 */
interface FormState {
  dbName: string;
  sqlDialect: string;
  createTableStatements: string;
}
