import {
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  TOPIC_KEYWORDS,
} from './keywords'

export type SentimentResult = {
  score: number // -1.0 ~ 1.0
  label: 'positive' | 'negative' | 'neutral'
  topics: string[]
}

export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return { score: 0, label: 'neutral', topics: [] }
  }

  const lowerText = text.toLowerCase()

  let positiveHits = 0
  let negativeHits = 0

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      positiveHits++
    }
  }

  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      negativeHits++
    }
  }

  const totalHits = positiveHits + negativeHits
  let score = 0
  let label: SentimentResult['label'] = 'neutral'

  if (totalHits > 0) {
    score = (positiveHits - negativeHits) / totalHits
    if (score > 0.2) label = 'positive'
    else if (score < -0.2) label = 'negative'
    else label = 'neutral'
  }

  // 主題分類
  const topics: string[] = []
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        topics.push(topic)
        break
      }
    }
  }

  return { score: Math.round(score * 100) / 100, label, topics }
}

// 批次分析
export function analyzeBatch(texts: string[]): SentimentResult[] {
  return texts.map(analyzeSentiment)
}
