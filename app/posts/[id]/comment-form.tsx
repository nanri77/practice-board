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
