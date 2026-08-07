import { describe, it, expect, beforeEach } from "vitest";
import { createDb, type DB } from "./db";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
} from "./posts";

let db: DB;

beforeEach(() => {
  db = createDb(":memory:");
});

describe("createPost", () => {
  it("inserts a post and returns it with matching created/updated timestamps", () => {
    const post = createPost(db, {
      nickname: "claude",
      title: "첫 글",
      content: "안녕하세요",
    });

    expect(post.id).toBeGreaterThan(0);
    expect(post.title).toBe("첫 글");
    expect(post.created_at).toBe(post.updated_at);
  });
});

describe("getPosts", () => {
  it("returns posts newest first", () => {
    createPost(db, { nickname: "a", title: "first", content: "..." });
    createPost(db, { nickname: "b", title: "second", content: "..." });

    const posts = getPosts(db);

    expect(posts).toHaveLength(2);
    expect(posts[0].title).toBe("second");
  });

  it("returns an empty array when there are no posts", () => {
    expect(getPosts(db)).toEqual([]);
  });
});

describe("getPost", () => {
  it("returns null for a missing id", () => {
    expect(getPost(db, 999)).toBeNull();
  });

  it("returns the matching post", () => {
    const created = createPost(db, { nickname: "a", title: "x", content: "y" });

    expect(getPost(db, created.id)?.title).toBe("x");
  });
});

describe("updatePost", () => {
  it("updates title and content and bumps updated_at", () => {
    const post = createPost(db, { nickname: "a", title: "old", content: "old" });

    const updated = updatePost(db, post.id, { title: "new", content: "new" });

    expect(updated?.title).toBe("new");
    expect(updated?.content).toBe("new");
  });

  it("returns null when the post doesn't exist", () => {
    expect(updatePost(db, 999, { title: "x", content: "y" })).toBeNull();
  });
});

describe("deletePost", () => {
  it("removes the post", () => {
    const post = createPost(db, { nickname: "a", title: "x", content: "x" });

    deletePost(db, post.id);

    expect(getPost(db, post.id)).toBeNull();
  });

  it("cascades to delete its comments", () => {
    const post = createPost(db, { nickname: "a", title: "x", content: "x" });
    db.prepare(
      "INSERT INTO comments (post_id, nickname, content) VALUES (?, ?, ?)"
    ).run(post.id, "commenter", "hi");

    deletePost(db, post.id);

    const remaining = db
      .prepare("SELECT * FROM comments WHERE post_id = ?")
      .all(post.id);
    expect(remaining).toHaveLength(0);
  });
});
