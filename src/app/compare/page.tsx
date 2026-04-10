import { fetchPosts, fetchDailyTrend } from '@/lib/data'
import { CompareClient } from './CompareClient'

export default async function ComparePage() {
  const posts = await fetchPosts()
  const dailyTrend = await fetchDailyTrend(posts)
  return <CompareClient posts={posts} dailyTrend={dailyTrend} />
}
