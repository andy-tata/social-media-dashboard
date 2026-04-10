import { fetchPosts } from '@/lib/data'
import { PostsClient } from './PostsClient'

export default async function PostsPage() {
  const posts = await fetchPosts()
  return <PostsClient posts={posts} />
}
