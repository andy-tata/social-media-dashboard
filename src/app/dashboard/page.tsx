import { fetchPosts, fetchDailyTrend } from '@/lib/data'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const posts = await fetchPosts()
  const dailyTrend = await fetchDailyTrend(posts)

  return <DashboardClient posts={posts} dailyTrend={dailyTrend} />
}
