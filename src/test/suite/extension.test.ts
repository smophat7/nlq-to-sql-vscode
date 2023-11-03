import * as assert from "assert";
import * as vscode from "vscode";
import { getTableName } from "../../database/convertCreateStatementsToTableInfo";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("getTableName 1", () => {
    assert.strictEqual("myTable", getTableName("CREATE TABLE myTable (...)"));
  });
  test("getTableName 2", () => {
    assert.strictEqual(
      "myTable",
      getTableName("CREATE TABLE IF NOT EXISTS myTable (...)")
    );
  });
  test("getTableName 3", () => {
    assert.strictEqual(
      "myTable",
      getTableName("CREATE\nTABLE\nIF\nNOT\nEXISTS\nmyTable (...)")
    );
  });
  test("getTableName 4", () => {
    assert.strictEqual("myTable", getTableName("CREATE\nTABLE myTable (...)"));
  });
  test("getTableName 5", () => {
    assert.strictEqual("myTable", getTableName("CREATE\nTABLE myTable\n(...)"));
  });
  test("getTableName 6", () => {
    assert.strictEqual("myTable", getTableName("CREATE TABLE\nmyTable\n(...)"));
  });
  test("getTableName 7", () => {
    assert.strictEqual(
      "myTable",
      getTableName("CREATE OR REPLACE TABLE myTable (...)")
    );
  });
  test("getTableName 8", () => {
    assert.strictEqual(
      "myTable",
      getTableName("CREATE\nOR REPLACE\nTABLE myTable (...)")
    );
  });
  test("getTableName 9", () => {
    assert.strictEqual(
      "myTable",
      getTableName("CREATE LOCAL TEMPORARY\nTABLE myTable (...)")
    );
  });
  test("getTableName empty error", () => {
    assert.throws(() => {
      getTableName("");
    });
  });
});
