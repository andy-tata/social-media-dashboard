import { fetchPosts, fetchComments } from '@/lib/data'
import { ReportsClient } from './ReportsClient'

export default async function ReportsPage() {
  const posts = await fetchPosts()
  const comments = await fetchComments()
  return <ReportsClient posts={posts} comments={comments} />
}
