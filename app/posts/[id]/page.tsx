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
    <div className="page">
      <div className="page-nav">
        <Link href="/">← 목록으로</Link>
      </div>

      <h1 className="post-detail-title">{post.title}</h1>
      <div className="post-detail-meta-block">
        <p className="post-detail-meta">
          <span className="seal-badge seal-badge--inline">{post.id}</span>
          {post.nickname} · {post.created_at}
        </p>
        {post.updated_at !== post.created_at && (
          <p className="post-detail-updated">수정됨 · {post.updated_at}</p>
        )}
      </div>
      <div className="post-detail-content">{post.content}</div>

      <div className="post-actions">
        <Link href={`/posts/${id}/edit`} className="text-link">
          수정
        </Link>
        <form action={boundDeletePost}>
          <button type="submit" className="text-link">
            삭제
          </button>
        </form>
      </div>

      <h2 className="comments-heading">댓글 {postComments.length}개</h2>
      <ul className="post-list">
        {postComments.map((comment) => {
          const boundDeleteComment = deleteCommentAction.bind(null, id, comment.id);
          return (
            <li className="comment-row" key={comment.id}>
              <span>
                <span className="comment-author">{comment.nickname}</span>
                {comment.content}
              </span>
              <form action={boundDeleteComment}>
                <button type="submit" className="text-link">
                  삭제
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      <CommentForm postId={id} />
    </div>
  );
}
