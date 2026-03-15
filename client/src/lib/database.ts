import { setInitialData } from "@/utils/setInitialData";
import { createClient } from "@libsql/client";

export interface Group {
  id: number;
  year: number;
  letter: string;
}
export interface Student {
  id: number;
  name: string;
  lastName: string;
  gender: "male" | "female";
  image: string | null;
  group_id: number;
  ease_factor: number;
  interval: number;
  repetitions: number;
  next_review: string;
}
export interface Comment {
  id: number;
  student_id: number;
  content: string;
  created_at: string;
}

const client = createClient({
  url: "file:data/local.db",
});

export const db = {
  // --- GROUPS ---
  groups: {
    getAll: async () => {
      const res = await client.execute("SELECT * FROM groups");
      return res.rows as unknown as Group[];
    },
    getById: async (id: number) => {
      const res = await client.execute({
        sql: "SELECT * FROM groups WHERE id = ?",
        args: [id],
      });
      return res.rows[0] as unknown as Group;
    },
    create: async (year: number, letter: string) => {
      const res = await client.execute({
        sql: "INSERT INTO groups (year, letter) VALUES (?, ?)",
        args: [year, letter],
      });
      return Number(res.lastInsertRowid);
    },
  },

  // --- STUDENTS ---
  students: {
    getAll: async () => {
      const res = await client.execute(`
        SELECT s.*, g.year, g.letter 
        FROM students s 
        LEFT JOIN groups g ON s.group_id = g.id
      `);
      return res.rows as unknown as (Student & {
        year: number;
        letter: string;
      })[];
    },
    getById: async (id: number) => {
      const res = await client.execute({
        sql: "SELECT * FROM students WHERE id = ?",
        args: [id],
      });
      return res.rows[0] as unknown as Student;
    },
    getByGroupId: async (groupId: number) => {
      const res = await client.execute({
        sql: "SELECT * FROM students WHERE group_id = ?",
        args: [groupId],
      });
      return res.rows as unknown as Student[];
    },
    getNextReview: async (groups?: number[]) => {
      let sql = `
        SELECT * FROM students 
        WHERE next_review <= CURRENT_TIMESTAMP
          AND image IS NOT NULL
      `;
      let args: number[] = [];

      if (groups && groups.length > 0) {
        const placeholders = groups.map(() => "?").join(",");
        sql += ` AND group_id IN (${placeholders})`;
        args = groups;
      }

      sql += " ORDER BY next_review ASC";
      sql += " LIMIT 1";
      const res = await client.execute({ sql, args });
      return res.rows[0] as unknown as Student | null;
    },
    getRandom: async (groups?: number[]) => {
      let sql = `
        SELECT * FROM students 
        WHERE image IS NOT NULL
      `;
      let args: number[] = [];

      if (groups && groups.length > 0) {
        const placeholders = groups.map(() => "?").join(",");
        sql += ` AND group_id IN (${placeholders})`;
        args = groups;
      }

      sql += " ORDER BY RANDOM()";
      sql += " LIMIT 1";
      const res = await client.execute({ sql, args });
      return res.rows[0] as unknown as Student | null;
    },
    getDistractors: async ({
      studentId,
      count,
    }: {
      studentId: number;
      count: number;
    }) => {
      // Same gender distractors
      const res = await client.execute({
        sql: `
          SELECT name || ' ' || lastName as fullName
          FROM students
          WHERE id != ? AND gender = (
            SELECT gender FROM students WHERE id = ?
          )
          ORDER BY RANDOM()
          LIMIT ?
        `,
        args: [studentId, studentId, count],
      });
      return res.rows as unknown as { fullName: string }[];
    },
    updateFactor: async ({
      id,
      ease_factor,
      interval,
      repetitions,
    }: Pick<Student, "id" | "ease_factor" | "interval" | "repetitions">) => {
      return client.execute({
        sql: `UPDATE students 
              SET ease_factor = ?, interval = ?, repetitions = ?, next_review = datetime('now', '+' || ? || ' days')
              WHERE id = ?`,
        args: [ease_factor, interval, repetitions, interval, id],
      });
    },
    create: async (
      student: Omit<
        Student,
        "id" | "next_review" | "ease_factor" | "interval" | "repetitions"
      >,
    ) => {
      const res = await client.execute({
        sql: "INSERT INTO students (name, lastName, image, group_id, gender) VALUES (?, ?, ?, ?, ?)",
        args: [
          student.name,
          student.lastName,
          student.image,
          student.group_id,
          student.gender,
        ],
      });
      return Number(res.lastInsertRowid);
    },
    update: async (id: number, student: Partial<Student>) => {
      return client.execute({
        sql: "UPDATE students SET name = COALESCE(?, name), lastName = COALESCE(?, lastName), gender = COALESCE(?, gender) WHERE id = ?",
        args: [
          student.name ?? null,
          student.lastName ?? null,
          student.gender ?? null,
          id,
        ],
      });
    },
    delete: async (id: number) => {
      return client.execute({
        sql: "DELETE FROM students WHERE id = ?",
        args: [id],
      });
    },
  },

  // --- COMMENTS ---
  comments: {
    getByStudentId: async (studentId: number) => {
      const res = await client.execute({
        sql: "SELECT * FROM comments WHERE student_id = ? ORDER BY created_at DESC",
        args: [studentId],
      });
      return res.rows as unknown as Comment[];
    },
    add: async (studentId: number, content: string) => {
      const res = await client.execute({
        sql: "INSERT INTO comments (student_id, content) VALUES (?, ?)",
        args: [studentId, content],
      });
      return Number(res.lastInsertRowid);
    },
  },
};

// Verify if tables exist
const res = await client.execute(
  `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('groups', 'students', 'comments')`,
);
const existingTables = res.rows.map((row) => row[0] as string);
const isNewDatabase =
  !existingTables.includes("groups") ||
  !existingTables.includes("students") ||
  !existingTables.includes("comments");

if (isNewDatabase) {
  // Create tables if they don't exist
  await client.batch([
    `PRAGMA foreign_keys = ON;`,

    ` CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      letter TEXT NOT NULL
  );`,

    ` CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      lastName TEXT NOT NULL,
      image TEXT,
      gender TEXT,
      group_id INTEGER,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 0,
      repetitions INTEGER DEFAULT 0,
      next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
  );`,
    `
  CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
  );`,
  ]);

  // Set initial data
  try {
    await setInitialData();
  } catch (error) {
    console.error("Error setting initial data:", error);
  }
}
