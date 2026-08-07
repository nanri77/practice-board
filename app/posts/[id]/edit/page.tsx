import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPost } from "@/lib/posts";
import EditForm from "./edit-form";

export default function EditPostPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const post = getPost(db, id);
  if (!post) notFound();

  return (
    <main>
      <h1>글 수정</h1>
      <EditForm postId={id} initialTitle={post.title} initialContent={post.content} />
    </main>
  );
}
