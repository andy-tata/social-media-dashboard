import { fetchPosts, fetchComments } from '@/lib/data'
import { PostsClient } from './PostsClient'

export default async function PostsPage() {
  const posts = await fetchPosts()
  const comments = await fetchComments()
  return <PostsClient posts={posts} comments={comments} />
}
