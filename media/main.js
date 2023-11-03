(function () {
  const vscode = acquireVsCodeApi();

  // Restore form state
  const oldState =
    /** @type {{ dbName: string, sqlDialect: string, createTableStatements: string } | undefined} */ (
      vscode.getState()
    );
  if (oldState) {
    const dbNameInput = document.getElementById("dbNameInput");
    const sqlDialectInput = document.getElementById("sqlDialectInput");
    const createTableStatementsInput = document.getElementById(
      "createTableStatementsInput"
    );
    dbNameInput.value = oldState.dbName;
    sqlDialectInput.value = oldState.sqlDialect;
    createTableStatementsInput.value = oldState.createTableStatements;
  }

  // Update state on change
  const formInputs = document.querySelectorAll(
    "#addDatabaseForm input, #addDatabaseForm textarea"
  );
  formInputs.forEach((input) => {
    input.addEventListener("input", () => {
      vscode.setState({
        dbName: document.getElementById("dbNameInput").value,
        sqlDialect: document.getElementById("sqlDialectInput").value,
        createTableStatements: document.getElementById(
          "createTableStatementsInput"
        ).value,
      });
    });
  });

  const form = document.getElementById("addDatabaseForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const dbNameInput = document.getElementById("dbNameInput");
    const sqlDialectInput = document.getElementById("sqlDialectInput");
    const createTableStatementsInput = document.getElementById(
      "createTableStatementsInput"
    );
    vscode.postMessage({
      command: "addDatabase",
      dbName: dbNameInput.value,
      sqlDialect: sqlDialectInput.value,
      createTableStatements: createTableStatementsInput.value,
    });
  });
})();
