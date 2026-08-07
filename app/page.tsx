import Link from "next/link";
import { db } from "@/lib/db";
import { getPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getPosts(db);

  return (
    <main>
      <h1>연습 게시판</h1>
      <p>
        <Link href="/posts/new">글쓰기</Link>
      </p>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.id}`}>{post.title}</Link>
            {" — "}
            {post.nickname} · {post.created_at}
          </li>
        ))}
        {posts.length === 0 && <li>아직 글이 없습니다.</li>}
      </ul>
    </main>
  );
}
