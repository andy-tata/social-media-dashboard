'use client'

import { useState } from 'react'
import { MetricCard } from '@/components/cards/MetricCard'
import { SentimentPieChart } from '@/components/charts/SentimentPieChart'
import { Badge } from '@/components/ui/badge'
import type { FbComment } from '@/types/database'

type CommentWithBrand = FbComment & { is_own: boolean }

export function SentimentClient({ comments }: { comments: CommentWithBrand[] }) {
  const [filter, setFilter] = useState<'all' | 'aov' | 'mlbb'>('all')

  const filtered = comments.filter((c) => {
    if (filter === 'aov') return c.is_own
    if (filter === 'mlbb') return !c.is_own
    return true
  })

  const positive = filtered.filter((c) => c.sentiment_label === 'positive').length
  const negative = filtered.filter((c) => c.sentiment_label === 'negative').length
  const neutral = filtered.filter((c) => c.sentiment_label === 'neutral').length
  const total = filtered.length

  const pieData = [
    { name: '正面', value: positive },
    { name: '負面', value: negative },
    { name: '中立', value: neutral },
  ]

  const filterLabel = filter === 'all' ? '全部' : filter === 'aov' ? '傳說對決' : 'MLBB'

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">情緒分析</h2>
        <p className="text-sm text-muted-foreground mt-1">留言情緒追蹤與趨勢</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'aov', 'mlbb'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {f === 'all' ? '全部' : f === 'aov' ? '傳說對決' : 'MLBB'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="正面留言" value={`${total > 0 ? ((positive / total) * 100).toFixed(0) : 0}%`} subtitle={`${positive} 則 · ${filterLabel}`} />
        <MetricCard title="負面留言" value={`${total > 0 ? ((negative / total) * 100).toFixed(0) : 0}%`} subtitle={`${negative} 則 · ${filterLabel}`} />
        <MetricCard title="中立留言" value={`${total > 0 ? ((neutral / total) * 100).toFixed(0) : 0}%`} subtitle={`${neutral} 則 · ${filterLabel}`} />
        <MetricCard title="留言總數" value={total} subtitle={filterLabel} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SentimentPieChart data={pieData} title={`情緒分佈 — ${filterLabel}`} />

        <div className="bg-card rounded-lg border border-border">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold">留言瀏覽 — {filterLabel}</h3>
          </div>
          <div className="divide-y divide-border max-h-[350px] overflow-auto">
            {filtered.map((c) => (
              <div key={c.id} className="p-3 flex items-start gap-2">
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs ${
                    c.sentiment_label === 'positive'
                      ? 'border-green-300 text-green-700 bg-green-50'
                      : c.sentiment_label === 'negative'
                      ? 'border-red-300 text-red-700 bg-red-50'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  {c.sentiment_label === 'positive' ? '正面' : c.sentiment_label === 'negative' ? '負面' : '中立'}
                </Badge>
                <Badge variant={c.is_own ? 'default' : 'secondary'} className="shrink-0 text-xs">
                  {c.is_own ? 'AoV' : 'MLBB'}
                </Badge>
                <div className="min-w-0">
                  <p className="text-sm">{c.comment_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.author_name} · {c.published_at ? new Date(c.published_at).toLocaleDateString('zh-TW') : '-'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
