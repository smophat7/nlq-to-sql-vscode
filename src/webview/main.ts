import {
  provideVSCodeDesignSystem,
  vsCodeButton,
  vsCodeTextArea,
  vsCodeTextField,
  TextField,
  Button,
  TextArea,
} from "@vscode/webview-ui-toolkit";
import * as constants from "../constants";

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

/**
 * Main function of the AddDatabase webview. Called when the webview DOM content is loaded.
 */
function main() {
  restoreState();

  const formElements = getFormElements();
  addSaveStateListeners(formElements);
  // addPreventSubmitOnEnterListeners(formElements);

  // There is a known bug where a <vscode-button> element inside a <form> does not trigger
  // the form's submit event when clicked. Until that's fixed, we'll call it manually.
  // See the issue at https://github.com/microsoft/vscode-webview-ui-toolkit/issues/395
  const submitButton = document.getElementById(
    constants.FORM_SUBMIT_BUTTON_ELEMENT_ID
  ) as Button;
  submitButton.addEventListener("click", (event) => {
    event.preventDefault();
    handleFormSubmit(formElements);
  });
}

/**
 * Adds event listeners to save state of the form when the user edits any input elements.
 *
 * @param formElements The elements of the form to add the listeners to.
 */
function addSaveStateListeners(formElements: FormElements) {
  formElements.dbNameInput.addEventListener("input", () =>
    saveState(formElements)
  );
  formElements.sqlDialectInput.addEventListener("input", () =>
    saveState(formElements)
  );
  formElements.createTableStatementsInput.addEventListener("input", () =>
    saveState(formElements)
  );
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
 * If the form is invalid, display an error message. Otherwise, ensure its hidden and send the message.
 *
 * @param formElements The elements of the form to get the data from.
 */
function handleFormSubmit(formElements: FormElements) {
  {
    const validationMessage = document.getElementById(
      constants.VALIDATION_MESSAGE_ELEMENT_ID
    ) as HTMLParagraphElement;
    if (!validateForm(formElements)) {
      validationMessage.style.display = "block";
      return;
    }

    validationMessage.style.display = "none";

    vscode.postMessage({
      command: constants.ADD_DATABASE_COMMAND_MESSAGE_CODE,
      dbName: formElements.dbNameInput.value,
      sqlDialect: formElements.sqlDialectInput.value,
      createTableStatements: formElements.createTableStatementsInput.value,
    });
  }
}

/**
 * Validate the form. No empty fields allowed.
 *
 * @param formElements The elements of the form to validate.
 * @returns True if the form is valid, false otherwise.
 */
function validateForm(formElements: FormElements): boolean {
  return (
    formElements.dbNameInput.value !== "" &&
    formElements.sqlDialectInput.value !== "" &&
    formElements.createTableStatementsInput.value !== ""
  );
}

/**
 * Get the elements of the form.
 *
 * @returns The elements of the form.
 */
function getFormElements(): FormElements {
  const dbNameInput = document.getElementById(
    constants.DATABASE_NAME_ELEMENT_ID
  ) as TextField;
  const sqlDialectInput = document.getElementById(
    constants.SQL_DIALENCT_ELEMENT_ID
  ) as TextField;
  const createTableStatementsInput = document.getElementById(
    constants.CREATE_TABLE_STATEMENTS_ELEMENT_ID
  ) as TextArea;

  if (!dbNameInput) {
    throw new Error(
      `Input with id ${constants.DATABASE_NAME_ELEMENT_ID} not found`
    );
  }
  if (!sqlDialectInput) {
    throw new Error(
      `Input with id ${constants.SQL_DIALENCT_ELEMENT_ID} not found`
    );
  }
  if (!createTableStatementsInput) {
    throw new Error(
      `Input with id ${constants.CREATE_TABLE_STATEMENTS_ELEMENT_ID} not found`
    );
  }
  return {
    dbNameInput: dbNameInput,
    sqlDialectInput: sqlDialectInput,
    createTableStatementsInput: createTableStatementsInput,
  } as FormElements;
}
