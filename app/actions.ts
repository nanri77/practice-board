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
