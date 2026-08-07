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
