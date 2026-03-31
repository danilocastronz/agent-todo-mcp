import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TaskDatabase } from "./database.js";

// Initialize the database (replaces our in-memory Map!)
const db = new TaskDatabase();

// Create the MCP server
// Notice the version bump to 1.1.0 — we did ship a real feature after all
const server = new McpServer({
  name: "todo-agent",
  version: "1.1.0",
});

// Tool: Add a new task
server.registerTool(
  "add_task",
  {
    description: "Create a new task with a title and optional description",
    inputSchema: {
      title: z.string().describe("The title of the task"),
      description: z
        .string()
        .optional()
        .describe("A detailed description of the task"),
    },
  },
  async ({ title, description }) => {
    const task = db.addTask(title, description);

    return {
      content: [
        {
          type: "text",
          text: `Task created successfully!\n\nID: ${task.id}\nTitle: ${task.title}\nStatus: ${task.status}`,
        },
      ],
    };
  },
);

// Tool: List all tasks
server.registerTool(
  "list_tasks",
  {
    description: "List all tasks, optionally filtered by status",
    inputSchema: {
      status: z
        .enum(["pending", "in-progress", "done", "all"])
        .optional()
        .default("all")
        .describe("Filter tasks by status"),
    },
  },
  async ({ status }) => {
    const tasks = db.listTasks(status);

    if (tasks.length === 0) {
      return {
        content: [{ type: "text", text: "No tasks found." }],
      };
    }

    const taskList = tasks
      .map(
        (t) =>
          `- [${t.status === "done" ? "x" : " "}] #${t.id}: ${t.title}${
            t.description ? `\n  ${t.description}` : ""
          }`,
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Tasks (${tasks.length}):\n\n${taskList}`,
        },
      ],
    };
  },
);

// Tool: Update task status
server.registerTool(
  "update_task",
  {
    description: "Update the status of a task",
    inputSchema: {
      id: z.string().describe("The ID of the task to update"),
      status: z
        .enum(["pending", "in-progress", "done"])
        .describe("The new status of the task"),
    },
  },
  async ({ id, status }) => {
    const task = db.updateTask(id, status);

    if (!task) {
      return {
        content: [{ type: "text", text: `Task #${id} not found.` }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Task #${id} updated to: ${status}\n\nTitle: ${task.title}`,
        },
      ],
    };
  },
);

// Tool: Delete a task
server.registerTool(
  "delete_task",
  {
    description: "Delete a task by its ID",
    inputSchema: {
      id: z.string().describe("The ID of the task to delete"),
    },
  },
  async ({ id }) => {
    const task = db.deleteTask(id);

    if (!task) {
      return {
        content: [{ type: "text", text: `Task #${id} not found.` }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Task #${id} ("${task.title}") has been deleted.`,
        },
      ],
    };
  },
);

// Tool: Get a summary of all tasks
server.registerTool(
  "get_task_summary",
  {
    description: "Get a summary with counts of tasks by status",
    inputSchema: {},
  },
  async () => {
    const summary = db.getSummary();

    return {
      content: [
        {
          type: "text",
          text: `Task Summary:\n\n📋 Total: ${summary.total}\n⏳ Pending: ${
            summary.pending
          }\n🔄 In Progress: ${summary.inProgress}\n✅ Done: ${
            summary.done
          }\n\nCompletion rate: ${
            summary.total > 0
              ? Math.round((summary.done / summary.total) * 100)
              : 0
          }%`,
        },
      ],
    };
  },
);

// Graceful shutdown — close the database connection
process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  db.close();
  process.exit(0);
});

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server running on stdio (with SQLite persistence!)");
}

main().catch(console.error);
