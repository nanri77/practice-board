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
    <form action={formAction} className="form-stack">
      <div className="field">
        <label htmlFor="title">제목</label>
        <input id="title" name="title" defaultValue={initialTitle} />
      </div>
      <div className="field">
        <label htmlFor="content">내용</label>
        <textarea id="content" name="content" defaultValue={initialContent} />
      </div>
      <button type="submit" className="seal-button">
        저장
      </button>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
