import { describe, it, expect } from "vitest";
import { createDb } from "./db";

describe("createDb", () => {
  it("creates the posts and comments tables", () => {
    const db = createDb(":memory:");

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
      )
      .all()
      .map((row: any) => row.name)
      .sort();

    expect(tables).toEqual(["comments", "posts"]);
  });

  it("enforces the foreign key from comments to posts", () => {
    const db = createDb(":memory:");

    expect(() => {
      db.prepare(
        "INSERT INTO comments (post_id, nickname, content) VALUES (999, 'x', 'y')"
      ).run();
    }).toThrow();
  });
});
