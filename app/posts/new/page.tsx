"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { createPostAction, type FormState } from "@/app/actions";

const initialState: FormState = {};

export default function NewPostPage() {
  const [state, formAction] = useFormState(createPostAction, initialState);

  return (
    <div className="page">
      <div className="page-nav">
        <Link href="/">← 목록으로</Link>
      </div>
      <h1 className="page-title">글쓰기</h1>
      <form action={formAction} className="form-stack">
        <div className="field">
          <label htmlFor="nickname">닉네임</label>
          <input id="nickname" name="nickname" />
        </div>
        <div className="field">
          <label htmlFor="title">제목</label>
          <input id="title" name="title" />
        </div>
        <div className="field">
          <label htmlFor="content">내용</label>
          <textarea id="content" name="content" />
        </div>
        <button type="submit" className="seal-button">
          등록
        </button>
        {state.error && (
          <p className="form-error" role="alert">
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}
