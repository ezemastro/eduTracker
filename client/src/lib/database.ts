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
  image: string | null;
  group_id: number | null;
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
    create: async (year: number, letter: string) => {
      return client.execute({
        sql: "INSERT INTO groups (year, letter) VALUES (?, ?)",
        args: [year, letter],
      });
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
      return res.rows;
    },
    getById: async (id: number) => {
      const res = await client.execute({
        sql: "SELECT * FROM students WHERE id = ?",
        args: [id],
      });
      return res.rows[0] as unknown as Student;
    },
    getByGroup: async (groupId: number) => {
      const res = await client.execute({
        sql: "SELECT * FROM students WHERE group_id = ?",
        args: [groupId],
      });
      return res.rows as unknown as Student[];
    },
    create: async (student: Omit<Student, "id">) => {
      return client.execute({
        sql: "INSERT INTO students (name, lastName, image, group_id) VALUES (?, ?, ?, ?)",
        args: [student.name, student.lastName, student.image, student.group_id],
      });
    },
    update: async (id: number, student: Partial<Student>) => {
      return client.execute({
        sql: "UPDATE students SET name = COALESCE(?, name), lastName = COALESCE(?, lastName) WHERE id = ?",
        args: [student.name ?? null, student.lastName ?? null, id],
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
    getByStudent: async (studentId: number) => {
      const res = await client.execute({
        sql: "SELECT * FROM comments WHERE student_id = ? ORDER BY created_at DESC",
        args: [studentId],
      });
      return res.rows as unknown as Comment[];
    },
    add: async (studentId: number, content: string) => {
      return client.execute({
        sql: "INSERT INTO comments (student_id, content) VALUES (?, ?)",
        args: [studentId, content],
      });
    },
  },
};
