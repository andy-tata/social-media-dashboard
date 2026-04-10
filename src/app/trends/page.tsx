import { fetchPosts } from '@/lib/data'
import { TrendsClient } from './TrendsClient'

export default async function TrendsPage() {
  const posts = await fetchPosts()
  return <TrendsClient posts={posts} />
}
