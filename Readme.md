# agent-todo-mcp

A simple MCP (Model Context Protocol) server that gives Claude the ability to manage tasks. Built as a companion project for the blog post [Building Your First AI Agent with Claude and MCP](https://www.welcomedeveloper.com/posts/building-ai-agent-claude-mcp/).

## What is this?

This is a minimal, working example of an AI Agent built with Claude and the [Model Context Protocol](https://modelcontextprotocol.io). It exposes five tools that Claude can call to manage a task list:

- **add_task** — Create a new task with a title and optional description
- **list_tasks** — List all tasks, optionally filtered by status
- **update_task** — Update the status of a task (pending, in-progress, done)
- **delete_task** — Delete a task by ID
- **get_task_summary** — Get a summary with counts by status and completion rate

The goal is to demonstrate the core pattern behind AI Agents: **LLM + Tools + Orchestration Loop**, using the simplest possible example.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Claude Desktop](https://claude.ai/download) or [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (requires a paid Anthropic plan)

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/danilocastronz/agent-todo-mcp.git
cd agent-todo-mcp
npm install
```

### 2. Build

```bash
npm run build
```

This compiles the TypeScript source in `src/` to JavaScript in `dist/`.

### 3. Run

```bash
npm start
```

This starts the MCP server (`dist/index.js`) over stdio. In practice you won't run it manually — Claude Desktop or Claude Code will launch it for you (see below).

### Connect with Claude Desktop

Edit the Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

Add the server entry (replace the path with your actual project location):

```json
{
  "mcpServers": {
    "todo-agent": {
      "command": "node",
      "args": ["/absolute/path/to/agent-todo-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. Go to Settings, Developer and check if the MCP server `todo-agent` is running as expected.

### Connect with Claude Code

If you have [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed:

```bash
claude mcp add --transport stdio todo-agent -- node /absolute/path/to/agent-todo-mcp/dist/index.js
```

## Usage

Once connected, just ask Claude in natural language:

```
Add a task called "Set up CI/CD pipeline" with the description "Configure GitHub Actions for the new microservice"
```

```
List all my pending tasks
```

```
Mark task 1 as in-progress
```

```
Give me a summary of my tasks
```

Claude will automatically call the right tools through MCP. You can even chain multiple actions in a single prompt:

```
Add three tasks: review the auth PR, write payment tests, and update the API docs. Then mark the PR review as in-progress and show me a summary.
```

## Project structure

```
agent-todo-mcp/
├── src/
│   └── index.ts        # MCP server with all tool definitions
├── dist/               # Compiled JavaScript (after build)
├── package.json
└── tsconfig.json
```

## Tech stack

- **TypeScript**
- **[@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)** — Official MCP TypeScript SDK
- **[Zod](https://zod.dev)** — Schema validation for tool inputs

## Blog post

This project is the companion code for the blog post **[Building Your First AI Agent with Claude and MCP](https://www.welcomedeveloper.com/posts/building-ai-agent-claude-mcp/)**, where we walk through every step from scratch — what AI Agents are, how MCP works, and how to build and connect your first MCP server.

## Useful resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Server Examples](https://github.com/modelcontextprotocol/servers)
- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)

## License

MIT
