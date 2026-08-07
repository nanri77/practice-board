import Link from "next/link";
import { db } from "@/lib/db";
import { getPosts } from "@/lib/posts";

export default function HomePage() {
  const posts = getPosts(db);

  return (
    <div className="page">
      <header className="board-header">
        <h1 className="board-title">연습 게시판</h1>
        <Link href="/posts/new" className="seal-button">
          글쓰기
        </Link>
      </header>
      <ul className="post-list">
        {posts.map((post) => (
          <li className="post-row" key={post.id}>
            <span className="seal-badge">{post.id}</span>
            <div className="post-row-body">
              <div className="post-row-title">
                <Link href={`/posts/${post.id}`}>{post.title}</Link>
              </div>
              <div className="post-row-meta">
                {post.nickname} · {post.created_at}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {posts.length === 0 && (
        <p className="empty-state">
          아직 게시된 글이 없습니다.
          <br />
          첫 글을 남겨보세요.
        </p>
      )}
    </div>
  );
}
