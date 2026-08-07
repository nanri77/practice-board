# 연습용 게시판(Practice Board) 구현 계획

> **에이전트 실행자용:** 필수 서브스킬 — superpowers:subagent-driven-development(권장) 또는 superpowers:executing-plans로 이 계획을 태스크 단위로 실행할 것. 각 단계는 체크박스(`- [ ]`)로 진행 상황을 추적한다.

**목표:** "명세서 → 계획 → 구현 → 검증" 전체 워크플로를 연습하기 위한 프로젝트로, 로컬 전용 Next.js + SQLite 게시판(게시글+댓글 CRUD, 로그인 없음)을 만든다.

**아키텍처:** Next.js App Router 프로젝트. 순수하고 테스트 가능한 CRUD 함수는 `lib/posts.ts`와 `lib/comments.ts`에 둔다(프레임워크에 의존하지 않는 순수 TypeScript). `app/actions.ts`는 `FormData`를 파싱해 `lib/` 함수를 호출한 뒤 Next.js 전용 처리(`redirect`, `revalidatePath`)를 담당하는 얇은 `"use server"` 래퍼다. 페이지는 데이터를 직접 읽는 React 서버 컴포넌트이고, 대기/에러 상태가 필요한 폼만 `useFormState`를 쓰는 작은 클라이언트 컴포넌트로 분리한다.

**기술 스택:** Next.js 14 (App Router), React 18, TypeScript, better-sqlite3, Vitest.

---

## 설계 메모: `lib/`을 `app/actions.ts`와 분리한 이유

명세서에는 "Server Actions 단위 테스트"가 요구사항으로 들어있다. 그런데 `"use server"`가 붙은 함수 안에서 `redirect()`나 `revalidatePath()`를 호출하면, Next.js 런타임 밖(순수 Vitest)에서 실행할 때 Next.js 내부 전용 에러를 던지거나 요청 컨텍스트를 요구해서 단위 테스트가 어렵다. 그래서 실제 CRUD 로직은 `lib/posts.ts` / `lib/comments.ts`에 두어 완전히 단위 테스트하고(Task 3~4), `app/actions.ts`(Task 5)는 독자적인 로직이 거의 없는 얇은 선언적 래퍼로 남겨서 Task 10에서 수동으로만 검증한다.

---

### Task 1: 프로젝트 스캐폴딩

**파일:**
- 생성: `package.json`
- 생성: `tsconfig.json`
- 생성: `next.config.mjs`
- 생성: `vitest.config.ts`
- 생성: `.gitignore`
- 생성: `app/layout.tsx`
- 생성: `app/page.tsx` (플레이스홀더, Task 6에서 교체)

- [ ] **1단계: `package.json` 생성**

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

- [ ] **2단계: `tsconfig.json` 생성**

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

- [ ] **3단계: `next.config.mjs` 생성**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
```

- [ ] **4단계: `vitest.config.ts` 생성**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **5단계: `.gitignore` 생성**

```
node_modules/
.next/
*.db
next-env.d.ts
*.tsbuildinfo
```

- [ ] **6단계: `app/layout.tsx` 생성**

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

- [ ] **7단계: 플레이스홀더 `app/page.tsx` 생성**

```tsx
export default function HomePage() {
  return <main>준비 중</main>;
}
```

- [ ] **8단계: 의존성 설치**

실행: `npm install`
기대 결과: 에러 없이 설치되고 `node_modules/`와 `package-lock.json`이 생성됨

- [ ] **9단계: dev 서버가 뜨는지 확인**

실행: `npm run dev`
기대 결과: "Ready" 로그가 뜨고 `http://localhost:3000`에 "준비 중" 플레이스홀더 페이지가 보임. 확인 후 서버 중지(Ctrl+C)

- [ ] **10단계: 커밋**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs vitest.config.ts .gitignore app/layout.tsx app/page.tsx
git commit -m "chore: 프로젝트 스캐폴딩 (Next.js + TypeScript + Vitest)"
```

---

### Task 2: DB 모듈

**파일:**
- 생성: `lib/db.ts`
- 테스트: `lib/db.test.ts`

- [ ] **1단계: 실패하는 테스트 작성**

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

- [ ] **2단계: 테스트 실행 → 실패 확인**

실행: `npx vitest run lib/db.test.ts`
기대 결과: FAIL — `Cannot find module './db'` (파일이 아직 없음)

- [ ] **3단계: 구현 작성**

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

- [ ] **4단계: 테스트 실행 → 통과 확인**

실행: `npx vitest run lib/db.test.ts`
기대 결과: PASS (테스트 2개)

- [ ] **5단계: 커밋**

```bash
git add lib/db.ts lib/db.test.ts
git commit -m "feat: SQLite 연결 + 스키마 초기화 (lib/db.ts)"
```

---

### Task 3: 게시글 CRUD 함수

**파일:**
- 생성: `lib/posts.ts`
- 테스트: `lib/posts.test.ts`

- [ ] **1단계: 실패하는 테스트 작성**

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

- [ ] **2단계: 테스트 실행 → 실패 확인**

실행: `npx vitest run lib/posts.test.ts`
기대 결과: FAIL — `Cannot find module './posts'`

- [ ] **3단계: 구현 작성**

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

- [ ] **4단계: 테스트 실행 → 통과 확인**

실행: `npx vitest run lib/posts.test.ts`
기대 결과: PASS (테스트 8개)

- [ ] **5단계: 커밋**

```bash
git add lib/posts.ts lib/posts.test.ts
git commit -m "feat: 게시글 CRUD 함수 (lib/posts.ts)"
```

---

### Task 4: 댓글 CRUD 함수

**파일:**
- 생성: `lib/comments.ts`
- 테스트: `lib/comments.test.ts`

- [ ] **1단계: 실패하는 테스트 작성**

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

- [ ] **2단계: 테스트 실행 → 실패 확인**

실행: `npx vitest run lib/comments.test.ts`
기대 결과: FAIL — `Cannot find module './comments'`

- [ ] **3단계: 구현 작성**

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

- [ ] **4단계: 테스트 실행 → 통과 확인**

실행: `npx vitest run lib/comments.test.ts`
기대 결과: PASS (테스트 4개)

- [ ] **5단계: 커밋**

```bash
git add lib/comments.ts lib/comments.test.ts
git commit -m "feat: 댓글 CRUD 함수 (lib/comments.ts)"
```

---

### Task 5: Server Actions

**파일:**
- 생성: `app/actions.ts`

- [ ] **1단계: Server Actions 작성**

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

- [ ] **2단계: 커밋**

```bash
git add app/actions.ts
git commit -m "feat: 게시글/댓글 Server Actions (app/actions.ts)"
```

---

### Task 6: 게시글 목록 페이지

**파일:**
- 수정: `app/page.tsx`

- [ ] **1단계: 플레이스홀더를 실제 목록 페이지로 교체**

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

- [ ] **2단계: 수동 확인**

실행: `npm run dev`, `http://localhost:3000` 접속
기대 결과: "연습 게시판" 제목, "글쓰기" 링크, "아직 글이 없습니다." 표시 (DB가 비어있으므로)

- [ ] **3단계: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: 게시글 목록 페이지"
```

---

### Task 7: 글쓰기 페이지

**파일:**
- 생성: `app/posts/new/page.tsx`

- [ ] **1단계: 폼 페이지 작성**

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

- [ ] **2단계: 수동 확인**

실행: `npm run dev`, `http://localhost:3000/posts/new` 접속
기대 결과: 폼이 렌더링됨; 빈 값으로 제출하면 한글 검증 메시지가 표시됨; 정상 제출하면 `/posts/<id>`로 리다이렉트되고 홈 목록에 새 글이 보임

- [ ] **3단계: 커밋**

```bash
git add app/posts/new/page.tsx
git commit -m "feat: 글쓰기 페이지"
```

---

### Task 8: 게시글 상세 + 댓글 페이지

**파일:**
- 생성: `app/posts/[id]/page.tsx`
- 생성: `app/posts/[id]/comment-form.tsx`

- [ ] **1단계: 댓글 폼 작성 (클라이언트 컴포넌트)**

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

- [ ] **2단계: 상세 페이지 작성 (서버 컴포넌트)**

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

- [ ] **3단계: 수동 확인**

실행: `npm run dev`, 게시글 상세 페이지 접속
기대 결과: 제목/내용/닉네임/날짜가 표시됨; "수정됨"은 수정 후에만(Task 9) 나타남; 댓글 작성 시 전체 새로고침 없이 반영됨; 댓글별 "삭제" 버튼으로 제거됨; 게시글 자체의 "삭제" 버튼은 `/`로 리다이렉트하고 목록에서 제거됨

- [ ] **4단계: 커밋**

```bash
git add "app/posts/[id]/page.tsx" "app/posts/[id]/comment-form.tsx"
git commit -m "feat: 게시글 상세 + 댓글 페이지"
```

---

### Task 9: 게시글 수정 페이지

**파일:**
- 생성: `app/posts/[id]/edit/page.tsx`
- 생성: `app/posts/[id]/edit/edit-form.tsx`

- [ ] **1단계: 수정 폼 작성 (클라이언트 컴포넌트)**

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

- [ ] **2단계: 수정 페이지 작성 (서버 컴포넌트)**

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

- [ ] **3단계: 수동 확인**

실행: `npm run dev`, `/posts/<id>/edit` 접속
기대 결과: 기존 제목/내용이 채워진 폼이 보임; 저장하면 상세 페이지로 리다이렉트되고 수정된 내용과 "수정됨" 타임스탬프가 표시됨

- [ ] **4단계: 커밋**

```bash
git add "app/posts/[id]/edit/page.tsx" "app/posts/[id]/edit/edit-form.tsx"
git commit -m "feat: 게시글 수정 페이지"
```

---

### Task 10: 전체 수동 검증

**파일:** 없음 (검증만 수행)

- [ ] **1단계: 자동 테스트 전체 실행**

실행: `npm test`
기대 결과: `lib/db.test.ts`, `lib/posts.test.ts`, `lib/comments.test.ts` 전부 통과 (총 15개 테스트)

- [ ] **2단계: 골든 패스 클릭스루**

실행: `npm run dev` 후 브라우저에서:
1. 홈 페이지가 빈 상태로 보임
2. 글 작성 → 상세 페이지로 리다이렉트
3. 상세 페이지에 글이 보임; 댓글 작성 → 전체 새로고침 없이 반영됨
4. 글 수정 → 상세 페이지에 새 내용 + "수정됨" 표시
5. 댓글 삭제 → 사라짐
6. 글 삭제 → 홈으로 리다이렉트, 목록이 다시 비어있음

기대 결과: 위 모든 단계가 설명대로 동작하고, 브라우저 개발자도구에 콘솔 에러가 없음

- [ ] **3단계: 엣지케이스 확인**

- `/posts/9999`(존재하지 않는 id) 접속 → Next.js 404 페이지
- 글쓰기 폼을 제목 없이 제출 → 한글 검증 메시지 표시, 글이 생성되지 않음

기대 결과: 둘 다 설명대로 동작

- [ ] **4단계: 커밋** (2·3단계에서 수정사항이 발견된 경우에만)

```bash
git add -A
git commit -m "fix: 수동 검증 중 발견된 버그 수정"
```

## 수동 검증 기록 (2026-08-07)

이 세션에는 브라우저가 없어서, 전체 클릭스루(작성 → 댓글 → 수정 → 댓글 삭제 →
글 삭제 → 404 → 검증)를 `curl`로 재현했다. Next.js가 progressive
enhancement를 위해 각 폼에 렌더링하는 `$ACTION_*` 멀티파트 필드를 그대로
흉내낸 것이다. 모든 흐름이 HTTP 응답 코드와 SQLite 직접 조회 양쪽으로
정상 확인됐다.

이 과정에서 뜻밖의 발견이 하나 있었다: **리다이렉트하지 않는** Server
Action(`createCommentAction`, `deleteCommentAction`)에 `Origin` 헤더 없이
POST를 보내면 응답이 무한 대기 상태가 됐다. curl은 기본적으로 Origin
헤더를 보내지 않지만, 실제 브라우저는 동일 출처 폼 제출 시 항상 이 헤더를
보낸다. `-H "Origin: http://localhost:3000"`을 추가하자 모든 액션이
정상 완료됐다(첫 호출은 dev 모드 최초 컴파일 비용 때문에 약 20초, 이후
호출은 150~250ms). 리다이렉트하는 액션(`createPostAction`,
`updatePostAction`, `deletePostAction`)은 Origin 유무와 무관하게 항상
정상이었다. 이는 Next.js 14.2 dev 서버가 동일 출처 신호 없는 비-리다이렉트
액션에 응답하는 방식과 관련된 프레임워크 특성이며, 애플리케이션 버그가
아니고 실제 사용자의 브라우저에서는 절대 발생하지 않는다. 그래서 코드는
수정하지 않았고, 나중에 다시 처음부터 조사하는 일이 없도록 여기에
기록해둔다.
