import { fetchComments } from '@/lib/data'
import { SentimentClient } from './SentimentClient'

export const dynamic = 'force-dynamic'

export default async function SentimentPage() {
  const comments = await fetchComments()
  return <SentimentClient comments={comments} />
}
