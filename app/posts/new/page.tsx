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
