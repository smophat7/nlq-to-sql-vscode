import * as vscode from "vscode";

/**
 * Inserts the given text into the given editor.
 *
 * @param editor The editor in which to insert the text.
 * @param text Text to insert into the editor.
 */
export function insertIntoEditor(editor: vscode.TextEditor, text: string) {
  editor.edit((editBuilder) => {
    editBuilder.replace(editor.selection, text);
  });
}
