'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { PostWithPage } from '@/lib/data'

export function TrendsClient({ posts }: { posts: PostWithPage[] }) {
  const [filter, setFilter] = useState<'all' | 'aov' | 'mlbb'>('all')

  const filteredPosts = posts.filter((p) => {
    if (filter === 'aov') return p.is_own
    if (filter === 'mlbb') return !p.is_own
    return true
  })

  // 關鍵字頻率
  const keywordCounts = new Map<string, number>()
  const allText = filteredPosts.map((p) => p.post_text || '')

  const hotKeywords = [
    '造型', '英雄', '活動', '更新', '比賽', '對決', '免費', '限定',
    '新英雄', '電競', '皮膚', '獎勵', '好看', '期待', '改版',
    'skin', 'hero', 'event', 'update', 'free', 'limited',
    'สกิน', 'ฮีโร่', 'อีเวนต์', 'ฟรี', 'กิจกรรม', 'แข่ง',
  ]

  for (const text of allText) {
    for (const kw of hotKeywords) {
      if (text.toLowerCase().includes(kw.toLowerCase())) {
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1)
      }
    }
  }

  const sortedKeywords = Array.from(keywordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const keywordData = sortedKeywords.map(([word, count]) => ({
    keyword: word,
    count,
  }))

  // 爆款貼文 — 用互動總數判斷
  const getEngagement = (p: PostWithPage) => p.reactions_total + p.comments_count + p.shares_count
  const avgEngagement = filteredPosts.reduce((s, p) => s + getEngagement(p), 0) / (filteredPosts.length || 1)
  const viralPosts = filteredPosts
    .filter((p) => getEngagement(p) > avgEngagement * 1.5)
    .sort((a, b) => getEngagement(b) - getEngagement(a))
    .slice(0, 5)

  const filterLabel = filter === 'all' ? '全部' : filter === 'aov' ? '傳說對決' : 'MLBB'

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">熱門話題</h2>
        <p className="text-sm text-muted-foreground mt-1">關鍵字頻率和爆款偵測</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">熱門關鍵字 Top 10 — {filterLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            {keywordData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">資料不足，尚無關鍵字統計</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={keywordData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="keyword" type="category" tick={{ fontSize: 12 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="count" name="出現次數" fill={filter === 'mlbb' ? '#ef4444' : '#3b82f6'} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              爆款貼文 — {filterLabel}
              <span className="text-xs text-muted-foreground font-normal ml-2">
                互動率 &gt; 平均值 1.5 倍
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {viralPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground">目前沒有爆款貼文</p>
              ) : (
                viralPosts.map((post, i) => (
                  <div key={post.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={post.is_own ? 'default' : 'secondary'} className="text-xs">
                          {post.is_own ? 'AoV' : 'MLBB'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {post.published_at ? new Date(post.published_at).toLocaleDateString('zh-TW') : '-'}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2">{post.post_text}</p>
                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{post.reactions_total.toLocaleString()} 反應</span>
                        <span className="font-medium text-blue-600">{getEngagement(post).toLocaleString()} 互動數</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
