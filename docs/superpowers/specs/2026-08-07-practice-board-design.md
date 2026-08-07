# 연습용 게시판 (practice-board) 설계

## 목적

Claude Code로 웹 프로젝트를 처음부터 끝까지 만들어보는 연습. 실서비스가 아니라
"아이디어 → 명세서 → 계획 → 구현 → 검증" 전체 사이클을 짧게 경험하는 것이 목표.

## 핵심 기능 (MVP 범위)

- 게시글 목록 조회
- 게시글 작성 / 상세보기 / 수정 / 삭제
- 댓글 작성 / 삭제 (수정 없음)
- 로그인 없이 닉네임만 입력해서 글/댓글 작성 (권한 체크 없음)

### 범위 밖

- 로그인/인증
- 게시글 수정 이력
- 댓글 수정
- 배포 (로컬 실행만 목표)

## 기술 스택

- 프론트/백엔드: Next.js (App Router)
- DB: SQLite (better-sqlite3)
- 데이터 변경: Server Actions (REST API 라우트 없이 폼 action이 서버 함수를 직접 호출)
- 테스트: Vitest (Server Actions 단위 테스트만, E2E는 범위 밖)

## 아키텍처

```
practice-board/
├── app/
│   ├── page.tsx                    (게시글 목록)
│   ├── posts/new/page.tsx          (글쓰기)
│   ├── posts/[id]/page.tsx         (상세보기 + 댓글)
│   ├── posts/[id]/edit/page.tsx    (수정)
│   └── actions.ts                  (Server Actions: 글/댓글 CRUD)
├── lib/
│   └── db.ts                       (SQLite 연결 + 스키마 초기화)
└── practice-board.db                (SQLite 파일, 최초 실행시 자동 생성)
```

## 데이터 모델

```sql
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- `comments.post_id`는 `posts.id`를 참조하는 외래키 (1:N 관계)
- `ON DELETE CASCADE`: 게시글 삭제 시 딸린 댓글도 함께 삭제
- 수정 시 `updated_at`을 `datetime('now')`로 갱신. `created_at`과 다를 때만 화면에 "수정됨" 표시

## 페이지 구성 & 화면 흐름

| 경로 | 역할 |
|---|---|
| `/` | 게시글 목록 (제목, 닉네임, 작성일시) |
| `/posts/new` | 글쓰기 폼 (닉네임, 제목, 내용) |
| `/posts/[id]` | 상세보기 + 댓글 목록 + 댓글 작성 폼 |
| `/posts/[id]/edit` | 수정 폼 (기존 값 미리 채움) |

흐름:
1. 목록(`/`)에서 글 클릭 → 상세(`/posts/[id]`)
2. 상세에서 "수정"/"삭제" 버튼 → 수정은 edit 페이지로 이동, 삭제는 Server Action 호출 후 목록으로 리다이렉트
3. 상세 하단 댓글 작성 → 같은 페이지에서 `revalidatePath`로 새로고침 없이 반영

권한 체크는 하지 않음 (로그인이 없는 구조이므로 누구나 수정/삭제 가능 — 의도적으로 단순화).

## 에러 처리 & 검증

- 필수값(닉네임/제목/내용) 중 하나라도 비어있으면 Server Action이 에러를 반환하고 폼에 표시 (`useFormState` 활용)
- 존재하지 않는 글 조회 시 `notFound()` 호출 → 404
- DB 에러는 try/catch로 감싸 사용자에게는 일반 메시지만 노출, 상세 에러는 서버 로그에만 기록

## 테스트

- Server Actions 단위 테스트 (Vitest): 글 생성/수정/삭제, 댓글 생성/삭제가 DB에 올바르게 반영되는지 확인
- E2E 테스트는 범위 밖 — 화면 동작은 `npm run dev`로 수동 확인
