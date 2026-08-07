import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPost } from "@/lib/posts";
import EditForm from "./edit-form";

export default function EditPostPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const post = getPost(db, id);
  if (!post) notFound();

  return (
    <div className="page">
      <div className="page-nav">
        <Link href={`/posts/${id}`}>← 상세로</Link>
      </div>
      <h1 className="page-title">글 수정</h1>
      <EditForm postId={id} initialTitle={post.title} initialContent={post.content} />
    </div>
  );
}
