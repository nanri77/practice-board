import type { DB } from "./db";

export interface Post {
  id: number;
  nickname: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function createPost(
  db: DB,
  input: { nickname: string; title: string; content: string }
): Post {
  const result = db
    .prepare("INSERT INTO posts (nickname, title, content) VALUES (?, ?, ?)")
    .run(input.nickname, input.title, input.content);
  return getPost(db, Number(result.lastInsertRowid))!;
}

export function getPosts(db: DB): Post[] {
  return db
    .prepare("SELECT * FROM posts ORDER BY created_at DESC, id DESC")
    .all() as Post[];
}

export function getPost(db: DB, id: number): Post | null {
  const row = db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
  return (row as Post) ?? null;
}

export function updatePost(
  db: DB,
  id: number,
  input: { title: string; content: string }
): Post | null {
  db.prepare(
    "UPDATE posts SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(input.title, input.content, id);
  return getPost(db, id);
}

export function deletePost(db: DB, id: number): void {
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
}
