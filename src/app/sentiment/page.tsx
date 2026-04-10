import { fetchComments } from '@/lib/data'
import { generateMockComments } from '@/lib/mockData'
import { SentimentClient } from './SentimentClient'

export default async function SentimentPage() {
  const realComments = await fetchComments()
  // 如果還沒有真實留言資料，用 mock data
  const comments = realComments.length > 0
    ? realComments
    : generateMockComments().map((c, i) => ({ ...c, is_own: i % 2 === 0 }))

  return <SentimentClient comments={comments} />
}
