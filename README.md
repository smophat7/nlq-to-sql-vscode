# NLQ-to-SQL for VS Code

VS Code extension for converting Natural Language Queries to SQL using OpenAI's API.

Users can supply a database schema and a question to convert, and the extension will generate SQL that can be run on the database. Users use their own OpenAI API key and select a model.

> [!WARNING]  
> This extension is in beta and is subject to bugs and incomplete features. Please open an issue if you find a bug or have a feature request.

## Quick Start

1. Install [VS Code](https://code.visualstudio.com/)
2. Install this [NLQ-to-SQL extension](https://marketplace.visualstudio.com/items?itemName=smophat7.nlq-to-sql)
3. Get an [OpenAI API key](https://beta.openai.com/account/api-keys)
4. Go the the extension's settings, enter your API key, and select a model.
5. Use the `NLQ-to-SQL: Add Database` command to add a database to the extension
6. Use the `NLQ-to-SQL: Generate SQL w/ AI` command to generate SQL from a question

## Features

### Views

This extension contributes a new view container called `NLQ-to-SQL` to the Activity Bar with the following views:

- **Database Explorer**: Shows the databases you've added to the extension. You can add a database by clicking the `+` button in the view's title bar. In this view you can manage and enable table contexts to use for NLQ-to-SQL queries.
- **Active Table Context**: Shows the tables included in the active table context. Any NLQ-to-SQL queries will use these tables only to generate SQL, instead of sending the entire database schema to OpenAI's API.
- **Generated SQL**: Shows a history of all NLQ-to-SQL queries you've generated. From here you can copy the SQL to your clipboard or insert it into the editor.

### Commands

The following commands can be run from the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) (`Ctrl+Shift+P`) or can have [keyboard shortcuts](https://code.visualstudio.com/docs/getstarted/keybindings) assigned to them:

- **NLQ-to-SQL: Generate SQL w/ AI**: Input a question and generate SQL using OpenAI's API. The resulting SQL will be inserted into the editor at the current cursor position.
- **NLQ-to-SQL: Add Database**: Follow the instructions to add a database to the extension. You must have a database added to use NLQ-to-SQL.
- **NLQ-to-SQL: Clear Query History**: Clear the history of generated SQL queries.

### Note:

- You must have an OpenAI API key to use this extension. You can get one [here](https://beta.openai.com/account/api-keys).
- This extension does not execute the generated SQL. You must run the SQL on your database yourself. There are a number of VS Code extensions that can do that for you, such as [SQLTools](https://marketplace.visualstudio.com/items?itemName=mtxr.sqltools).
- All database information and other extension information is associated with a specific [Workspace](https://code.visualstudio.com/docs/editor/workspaces).

## Changelog

See the [changelog](CHANGELOG.md) for release notes.
