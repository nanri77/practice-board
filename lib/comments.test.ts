import { describe, it, expect, beforeEach } from "vitest";
import { createDb, type DB } from "./db";
import { createPost } from "./posts";
import { createComment, getComments, deleteComment } from "./comments";

let db: DB;
let postId: number;

beforeEach(() => {
  db = createDb(":memory:");
  postId = createPost(db, { nickname: "author", title: "t", content: "c" }).id;
});

describe("createComment", () => {
  it("inserts a comment linked to the post", () => {
    const comment = createComment(db, {
      postId,
      nickname: "commenter",
      content: "hi",
    });

    expect(comment.id).toBeGreaterThan(0);
    expect(comment.post_id).toBe(postId);
    expect(comment.content).toBe("hi");
  });
});

describe("getComments", () => {
  it("returns comments for a post, oldest first", () => {
    createComment(db, { postId, nickname: "a", content: "first" });
    createComment(db, { postId, nickname: "b", content: "second" });

    const comments = getComments(db, postId);

    expect(comments).toHaveLength(2);
    expect(comments[0].content).toBe("first");
  });

  it("returns an empty array when there are no comments", () => {
    expect(getComments(db, postId)).toEqual([]);
  });
});

describe("deleteComment", () => {
  it("removes the comment", () => {
    const comment = createComment(db, { postId, nickname: "a", content: "x" });

    deleteComment(db, comment.id);

    expect(getComments(db, postId)).toHaveLength(0);
  });
});
