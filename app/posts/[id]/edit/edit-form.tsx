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
