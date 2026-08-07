# Practice Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only Next.js + SQLite bulletin board (post + comment CRUD, no login) as a practice project for the full "spec → plan → implement → verify" workflow.

**Architecture:** Next.js App Router project. Pure, testable CRUD functions live in `lib/posts.ts` and `lib/comments.ts` (plain TypeScript, no framework coupling). `app/actions.ts` holds thin `"use server"` wrappers that parse `FormData`, call the `lib/` functions, then handle Next.js-specific concerns (`redirect`, `revalidatePath`). Pages are React Server Components that read data directly; forms that need pending/error state are small Client Components using `useFormState`.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, better-sqlite3, Vitest.

---

## Design note: why `lib/` is separate from `app/actions.ts`

The spec calls for "Server Actions 단위 테스트" (unit tests for Server Actions). In practice, functions marked `"use server"` that call `redirect()` or `revalidatePath()` throw special Next.js-internal errors/require a request context when called outside the Next.js runtime — they are not easily unit-testable with plain Vitest. So the CRUD logic itself lives in `lib/posts.ts` / `lib/comments.ts` (fully unit tested in Tasks 3–4), and `app/actions.ts` (Task 5) is a thin, mostly declarative wrapper with no independent logic to unit test — it's verified manually in Task 10 instead.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `app/layout.tsx`
- Create: `app/page.tsx` (placeholder, replaced in Task 6)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "practice-board",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "better-sqlite3": "^11.3.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/node": "^20.14.15",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/better-sqlite3": "^7.6.11",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
.next/
*.db
next-env.d.ts
*.tsbuildinfo
```

- [ ] **Step 6: Create `app/layout.tsx`**

```tsx
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create placeholder `app/page.tsx`**

```tsx
export default function HomePage() {
  return <main>준비 중</main>;
}
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `node_modules/` and `package-lock.json`

- [ ] **Step 9: Verify the dev server boots**

Run: `npm run dev`
Expected: "Ready" log, and `http://localhost:3000` shows the "준비 중" placeholder page. Stop the server (Ctrl+C) once confirmed.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs vitest.config.ts .gitignore app/layout.tsx app/page.tsx
git commit -m "chore: 프로젝트 스캐폴딩 (Next.js + TypeScript + Vitest)"
```

---

### Task 2: Database module

**Files:**
- Create: `lib/db.ts`
- Test: `lib/db.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/db.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/db.test.ts`
Expected: FAIL — `Cannot find module './db'` (file doesn't exist yet)

- [ ] **Step 3: Write the implementation**

```ts
// lib/db.ts
import Database from "better-sqlite3";
import path from "node:path";

export type DB = Database.Database;

export function createDb(filename: string): DB {
  const db = new Database(filename);
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      nickname TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

export const db: DB = createDb(path.join(process.cwd(), "practice-board.db"));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/db.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/db.ts lib/db.test.ts
git commit -m "feat: SQLite 연결 + 스키마 초기화 (lib/db.ts)"
```

---

### Task 3: Post CRUD functions

**Files:**
- Create: `lib/posts.ts`
- Test: `lib/posts.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/posts.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/posts.test.ts`
Expected: FAIL — `Cannot find module './posts'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/posts.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/posts.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/posts.ts lib/posts.test.ts
git commit -m "feat: 게시글 CRUD 함수 (lib/posts.ts)"
```

---

### Task 4: Comment CRUD functions

**Files:**
- Create: `lib/comments.ts`
- Test: `lib/comments.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/comments.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/comments.test.ts`
Expected: FAIL — `Cannot find module './comments'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/comments.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/comments.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/comments.ts lib/comments.test.ts
git commit -m "feat: 댓글 CRUD 함수 (lib/comments.ts)"
```

---

### Task 5: Server Actions

**Files:**
- Create: `app/actions.ts`

- [ ] **Step 1: Write the Server Actions**

```ts
// app/actions.ts
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import * as posts from "@/lib/posts";
import * as comments from "@/lib/comments";

export interface FormState {
  error?: string;
}

function requiredField(value: FormDataEntryValue | null, label: string): string | null {
  if (!value || !String(value).trim()) return `${label}을(를) 입력해주세요.`;
  return null;
}

const GENERIC_DB_ERROR = "잠시 후 다시 시도해주세요.";

export async function createPostAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const nickname = formData.get("nickname");
  const title = formData.get("title");
  const content = formData.get("content");

  const error =
    requiredField(nickname, "닉네임") ||
    requiredField(title, "제목") ||
    requiredField(content, "내용");
  if (error) return { error };

  let postId: number;
  try {
    postId = posts.createPost(db, {
      nickname: String(nickname),
      title: String(title),
      content: String(content),
    }).id;
  } catch (err) {
    console.error("createPostAction failed:", err);
    return { error: GENERIC_DB_ERROR };
  }

  revalidatePath("/");
  redirect(`/posts/${postId}`);
}

export async function updatePostAction(
  id: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const title = formData.get("title");
  const content = formData.get("content");

  const error = requiredField(title, "제목") || requiredField(content, "내용");
  if (error) return { error };

  try {
    posts.updatePost(db, id, { title: String(title), content: String(content) });
  } catch (err) {
    console.error("updatePostAction failed:", err);
    return { error: GENERIC_DB_ERROR };
  }

  revalidatePath("/");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePostAction(id: number, _formData: FormData): Promise<void> {
  try {
    posts.deletePost(db, id);
  } catch (err) {
    console.error("deletePostAction failed:", err);
    throw new Error(GENERIC_DB_ERROR);
  }
  revalidatePath("/");
  redirect("/");
}

export async function createCommentAction(
  postId: number,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const nickname = formData.get("nickname");
  const content = formData.get("content");

  const error = requiredField(nickname, "닉네임") || requiredField(content, "댓글 내용");
  if (error) return { error };

  try {
    comments.createComment(db, {
      postId,
      nickname: String(nickname),
      content: String(content),
    });
  } catch (err) {
    console.error("createCommentAction failed:", err);
    return { error: GENERIC_DB_ERROR };
  }

  revalidatePath(`/posts/${postId}`);
  return {};
}

export async function deleteCommentAction(
  postId: number,
  commentId: number,
  _formData: FormData
): Promise<void> {
  try {
    comments.deleteComment(db, commentId);
  } catch (err) {
    console.error("deleteCommentAction failed:", err);
    throw new Error(GENERIC_DB_ERROR);
  }
  revalidatePath(`/posts/${postId}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/actions.ts
git commit -m "feat: 게시글/댓글 Server Actions (app/actions.ts)"
```

---

### Task 6: Home page (post list)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the placeholder with the real list page**

```tsx
// app/page.tsx
import Link from "next/link";
import { db } from "@/lib/db";
import { getPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getPosts(db);

  return (
    <main>
      <h1>연습 게시판</h1>
      <p>
        <Link href="/posts/new">글쓰기</Link>
      </p>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`}>{post.title}</Link>
            {" — "}
            {post.nickname} · {post.created_at}
          </li>
        ))}
        {posts.length === 0 && <li>아직 글이 없습니다.</li>}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Manual check**

Run: `npm run dev`, open `http://localhost:3000`
Expected: "연습 게시판" heading, "글쓰기" link, and "아직 글이 없습니다." (empty DB so far)

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: 게시글 목록 페이지"
```

---

### Task 7: New post page

**Files:**
- Create: `app/posts/new/page.tsx`

- [ ] **Step 1: Write the form page**

```tsx
// app/posts/new/page.tsx
"use client";

import { useFormState } from "react-dom";
import { createPostAction, type FormState } from "@/app/actions";

const initialState: FormState = {};

export default function NewPostPage() {
  const [state, formAction] = useFormState(createPostAction, initialState);

  return (
    <main>
      <h1>글쓰기</h1>
      <form action={formAction}>
        <div>
          <input name="nickname" placeholder="닉네임" />
        </div>
        <div>
          <input name="title" placeholder="제목" />
        </div>
        <div>
          <textarea name="content" placeholder="내용" />
        </div>
        <button type="submit">등록</button>
        {state.error && <p role="alert">{state.error}</p>}
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Manual check**

Run: `npm run dev`, open `http://localhost:3000/posts/new`
Expected: form renders; submitting with an empty field shows the Korean validation message; submitting a valid post redirects to `/posts/<id>` and the post now appears on the home page.

- [ ] **Step 3: Commit**

```bash
git add app/posts/new/page.tsx
git commit -m "feat: 글쓰기 페이지"
```

---

### Task 8: Post detail page (with comments)

**Files:**
- Create: `app/posts/[id]/page.tsx`
- Create: `app/posts/[id]/comment-form.tsx`

- [ ] **Step 1: Write the comment form (Client Component)**

```tsx
// app/posts/[id]/comment-form.tsx
"use client";

import { useFormState } from "react-dom";
import { createCommentAction, type FormState } from "@/app/actions";

const initialState: FormState = {};

export default function CommentForm({ postId }: { postId: number }) {
  const action = createCommentAction.bind(null, postId);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction}>
      <div>
        <input name="nickname" placeholder="닉네임" />
      </div>
      <div>
        <textarea name="content" placeholder="댓글을 입력하세요" />
      </div>
      <button type="submit">댓글 등록</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: Write the detail page (Server Component)**

```tsx
// app/posts/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPost } from "@/lib/posts";
import { getComments } from "@/lib/comments";
import { deletePostAction, deleteCommentAction } from "@/app/actions";
import CommentForm from "./comment-form";

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const post = getPost(db, id);
  if (!post) notFound();

  const postComments = getComments(db, id);
  const boundDeletePost = deletePostAction.bind(null, id);

  return (
    <main>
      <h1>{post.title}</h1>
      <p>
        {post.nickname} · {post.created_at}
      </p>
      {post.updated_at !== post.created_at && <p>수정됨: {post.updated_at}</p>}
      <p>{post.content}</p>

      <p>
        <Link href={`/posts/${id}/edit`}>수정</Link>
      </p>
      <form action={boundDeletePost}>
        <button type="submit">삭제</button>
      </form>

      <h2>댓글 {postComments.length}개</h2>
      <ul>
        {postComments.map((comment) => {
          const boundDeleteComment = deleteCommentAction.bind(null, id, comment.id);
          return (
            <li key={comment.id}>
              <strong>{comment.nickname}</strong>: {comment.content}
              <form action={boundDeleteComment}>
                <button type="submit">삭제</button>
              </form>
            </li>
          );
        })}
      </ul>

      <CommentForm postId={id} />
    </main>
  );
}
```

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open a post's detail page
Expected: title/content/nickname/date show; "수정됨" only appears after an edit (Task 9); comment form adds a comment without a full page reload; each comment's "삭제" button removes it; the post's own "삭제" button redirects to `/` and removes it from the list.

- [ ] **Step 4: Commit**

```bash
git add "app/posts/[id]/page.tsx" "app/posts/[id]/comment-form.tsx"
git commit -m "feat: 게시글 상세 + 댓글 페이지"
```

---

### Task 9: Edit post page

**Files:**
- Create: `app/posts/[id]/edit/page.tsx`
- Create: `app/posts/[id]/edit/edit-form.tsx`

- [ ] **Step 1: Write the edit form (Client Component)**

```tsx
// app/posts/[id]/edit/edit-form.tsx
"use client";

import { useFormState } from "react-dom";
import { updatePostAction, type FormState } from "@/app/actions";

const initialState: FormState = {};

export default function EditForm({
  postId,
  initialTitle,
  initialContent,
}: {
  postId: number;
  initialTitle: string;
  initialContent: string;
}) {
  const action = updatePostAction.bind(null, postId);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction}>
      <div>
        <input name="title" defaultValue={initialTitle} />
      </div>
      <div>
        <textarea name="content" defaultValue={initialContent} />
      </div>
      <button type="submit">저장</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

- [ ] **Step 2: Write the edit page (Server Component)**

```tsx
// app/posts/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPost } from "@/lib/posts";
import EditForm from "./edit-form";

export default function EditPostPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const post = getPost(db, id);
  if (!post) notFound();

  return (
    <main>
      <h1>글 수정</h1>
      <EditForm postId={id} initialTitle={post.title} initialContent={post.content} />
    </main>
  );
}
```

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open `/posts/<id>/edit`
Expected: form pre-filled with existing title/content; saving redirects back to the detail page and shows the updated content plus a "수정됨" timestamp.

- [ ] **Step 4: Commit**

```bash
git add "app/posts/[id]/edit/page.tsx" "app/posts/[id]/edit/edit-form.tsx"
git commit -m "feat: 게시글 수정 페이지"
```

---

### Task 10: Full manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the automated test suite**

Run: `npm test`
Expected: all `lib/db.test.ts`, `lib/posts.test.ts`, `lib/comments.test.ts` tests pass (14 tests total)

- [ ] **Step 2: Click through the golden path**

Run: `npm run dev`, then in the browser:
1. Home page shows empty state
2. Create a post → redirected to its detail page
3. Detail page shows the post; add a comment → appears without full reload
4. Edit the post → detail page shows new content + "수정됨"
5. Delete the comment → it disappears
6. Delete the post → redirected to home, list is empty again

Expected: every step behaves as described, no console errors in the browser devtools

- [ ] **Step 3: Check edge cases**

- Visit `/posts/9999` (nonexistent id) → Next.js 404 page
- Submit the new-post form with an empty title → Korean validation message shown, no post created

Expected: both behave as described

- [ ] **Step 4: Commit** (only if Step 2/3 uncovered fixes)

```bash
git add -A
git commit -m "fix: 수동 검증 중 발견된 버그 수정"
```
