import type { DB } from "./db";

export interface Comment {
  id: number;
  post_id: number;
  nickname: string;
  content: string;
  created_at: string;
}

export function createComment(
  db: DB,
  input: { postId: number; nickname: string; content: string }
): Comment {
  const result = db
    .prepare("INSERT INTO comments (post_id, nickname, content) VALUES (?, ?, ?)")
    .run(input.postId, input.nickname, input.content);
  return db
    .prepare("SELECT * FROM comments WHERE id = ?")
    .get(result.lastInsertRowid) as Comment;
}

export function getComments(db: DB, postId: number): Comment[] {
  return db
    .prepare(
      "SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC, id ASC"
    )
    .all(postId) as Comment[];
}

export function deleteComment(db: DB, id: number): void {
  db.prepare("DELETE FROM comments WHERE id = ?").run(id);
}
