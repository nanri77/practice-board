"use client";

import { useFormState } from "react-dom";
import { createCommentAction, type FormState } from "@/app/actions";

const initialState: FormState = {};

export default function CommentForm({ postId }: { postId: number }) {
  const action = createCommentAction.bind(null, postId);
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="comment-form form-stack">
      <div className="field">
        <label htmlFor="nickname">닉네임</label>
        <input id="nickname" name="nickname" />
      </div>
      <div className="field">
        <label htmlFor="content">댓글</label>
        <textarea id="content" name="content" placeholder="댓글을 입력하세요" />
      </div>
      <button type="submit" className="seal-button seal-button--small">
        댓글 등록
      </button>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
