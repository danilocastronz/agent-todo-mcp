import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Our in-memory task store
interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "done";
  createdAt: string;
}

const tasks: Map<string, Task> = new Map();
let nextId = 1;

// Create the MCP server
const server = new McpServer({
  name: "todo-agent",
  version: "1.0.0",
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
    const id = String(nextId++);
    const task: Task = {
      id,
      title,
      description,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    tasks.set(id, task);

    return {
      content: [
        {
          type: "text",
          text: `Task created successfully!\n\nID: ${id}\nTitle: ${title}\nStatus: pending`,
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
    let filteredTasks = Array.from(tasks.values());

    if (status !== "all") {
      filteredTasks = filteredTasks.filter((t) => t.status === status);
    }

    if (filteredTasks.length === 0) {
      return {
        content: [{ type: "text", text: "No tasks found." }],
      };
    }

    const taskList = filteredTasks
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
          text: `Tasks (${filteredTasks.length}):\n\n${taskList}`,
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
    const task = tasks.get(id);

    if (!task) {
      return {
        content: [{ type: "text", text: `Task #${id} not found.` }],
        isError: true,
      };
    }

    const oldStatus = task.status;
    task.status = status;

    return {
      content: [
        {
          type: "text",
          text: `Task #${id} updated: ${oldStatus} → ${status}\n\nTitle: ${task.title}`,
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
    const task = tasks.get(id);

    if (!task) {
      return {
        content: [{ type: "text", text: `Task #${id} not found.` }],
        isError: true,
      };
    }

    tasks.delete(id);

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
    const all = Array.from(tasks.values());
    const pending = all.filter((t) => t.status === "pending").length;
    const inProgress = all.filter((t) => t.status === "in-progress").length;
    const done = all.filter((t) => t.status === "done").length;

    return {
      content: [
        {
          type: "text",
          text: `Task Summary:\n\n📋 Total: ${all.length}\n⏳ Pending: ${pending}\n🔄 In Progress: ${inProgress}\n✅ Done: ${done}\n\nCompletion rate: ${
            all.length > 0 ? Math.round((done / all.length) * 100) : 0
          }%`,
        },
      ],
    };
  },
);

// Start the server using stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Todo MCP Server running on stdio");
}

main().catch(console.error);
