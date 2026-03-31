import Database from "better-sqlite3";
import path from "path";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "done";
  createdAt: string;
}

export class TaskDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    // Resolve relative to the script location, not the working directory
    const resolvedPath = dbPath || path.join(__dirname, "..", "tasks.db");
    this.db = new Database(resolvedPath);

    // Enable WAL mode for better performance
    this.db.pragma("journal_mode = WAL");

    // Create the tasks table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  addTask(title: string, description?: string): Task {
    const stmt = this.db.prepare(
      "INSERT INTO tasks (title, description) VALUES (?, ?)",
    );
    const result = stmt.run(title, description || null);

    return this.getTask(String(result.lastInsertRowid))!;
  }

  getTask(id: string): Task | undefined {
    const stmt = this.db.prepare("SELECT * FROM tasks WHERE id = ?");
    const row = stmt.get(id) as any;

    if (!row) return undefined;

    return {
      id: String(row.id),
      title: row.title,
      description: row.description || undefined,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  listTasks(status?: string): Task[] {
    let stmt;

    if (status && status !== "all") {
      stmt = this.db.prepare(
        "SELECT * FROM tasks WHERE status = ? ORDER BY id",
      );
      return (stmt.all(status) as any[]).map(this.rowToTask);
    }

    stmt = this.db.prepare("SELECT * FROM tasks ORDER BY id");
    return (stmt.all() as any[]).map(this.rowToTask);
  }

  updateTask(id: string, status: string): Task | undefined {
    const existing = this.getTask(id);
    if (!existing) return undefined;

    const stmt = this.db.prepare("UPDATE tasks SET status = ? WHERE id = ?");
    stmt.run(status, id);

    return this.getTask(id);
  }

  deleteTask(id: string): Task | undefined {
    const existing = this.getTask(id);
    if (!existing) return undefined;

    const stmt = this.db.prepare("DELETE FROM tasks WHERE id = ?");
    stmt.run(id);

    return existing;
  }

  getSummary(): {
    total: number;
    pending: number;
    inProgress: number;
    done: number;
  } {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks
    `);
    const row = stmt.get() as any;

    return {
      total: row.total,
      pending: row.pending,
      inProgress: row.in_progress,
      done: row.done,
    };
  }

  close(): void {
    this.db.close();
  }

  private rowToTask(row: any): Task {
    return {
      id: String(row.id),
      title: row.title,
      description: row.description || undefined,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
