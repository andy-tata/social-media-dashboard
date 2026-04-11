import { fetchPosts, fetchComments } from '@/lib/data'
import { ReportsClient } from './ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const posts = await fetchPosts()
  const comments = await fetchComments()
  return <ReportsClient posts={posts} comments={comments} />
}
