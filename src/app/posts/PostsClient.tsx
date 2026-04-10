'use client'

import { useState } from 'react'
import { CATEGORY_LABELS, POST_TYPE_LABELS } from '@/lib/utils/postClassifier'
import { MetricCard } from '@/components/cards/MetricCard'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PostWithPage } from '@/lib/data'

type SortKey = 'published_at' | 'reactions_total' | 'comments_count' | 'shares_count' | 'engagement_rate'

export function PostsClient({ posts }: { posts: PostWithPage[] }) {
  const [filter, setFilter] = useState<'all' | 'aov' | 'mlbb'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('published_at')
  const [sortDesc, setSortDesc] = useState(true)

  const filtered = posts.filter((p) => {
    if (filter === 'aov') return p.is_own
    if (filter === 'mlbb') return !p.is_own
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey] ?? 0
    const bVal = b[sortKey] ?? 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
    }
    return sortDesc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
  })

  const thisWeek = filtered.filter(
    (p) => new Date(p.published_at!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  )
  const lastWeek = filtered.filter((p) => {
    const t = new Date(p.published_at!).getTime()
    return t > Date.now() - 14 * 24 * 60 * 60 * 1000 && t <= Date.now() - 7 * 24 * 60 * 60 * 1000
  })
  const thisWeekInteraction = thisWeek.reduce((s, p) => s + p.reactions_total + p.comments_count + p.shares_count, 0)
  const lastWeekInteraction = lastWeek.reduce((s, p) => s + p.reactions_total + p.comments_count + p.shares_count, 0)
  const interactionChange = lastWeekInteraction > 0
    ? ((thisWeekInteraction - lastWeekInteraction) / lastWeekInteraction) * 100 : 0
  const thisWeekEngagement = thisWeek.length > 0
    ? thisWeek.reduce((s, p) => s + (p.engagement_rate || 0), 0) / thisWeek.length : 0
  const lastWeekEngagement = lastWeek.length > 0
    ? lastWeek.reduce((s, p) => s + (p.engagement_rate || 0), 0) / lastWeek.length : 0
  const engagementChange = lastWeekEngagement > 0
    ? ((thisWeekEngagement - lastWeekEngagement) / lastWeekEngagement) * 100 : 0

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(!sortDesc)
    else { setSortKey(key); setSortDesc(true) }
  }

  const SortIcon = ({ active, desc }: { active: boolean; desc: boolean }) => (
    <span className="ml-1 text-xs">{active ? (desc ? '▼' : '▲') : '⇅'}</span>
  )

  const filterLabel = filter === 'all' ? '全部' : filter === 'aov' ? '傳說對決' : 'MLBB'

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold">內容表現</h2>
        <p className="text-sm text-muted-foreground mt-1">所有貼文的互動數據（每日抓取各粉專最新 30 篇貼文）</p>
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
        <MetricCard
          title="本週貼文數"
          value={thisWeek.length}
          change={lastWeek.length > 0 ? ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100 : 0}
          subtitle={`vs 上週 ${lastWeek.length} 篇 · ${filterLabel}`}
        />
        <MetricCard title="本週總互動" value={thisWeekInteraction.toLocaleString()} change={interactionChange} subtitle={`vs 上週 · ${filterLabel}`} />
        <MetricCard title="本週平均互動率" value={`${thisWeekEngagement.toFixed(2)}%`} change={engagementChange} subtitle={`vs 上週 · ${filterLabel}`} />
        <MetricCard title="資料總筆數" value={filtered.length} subtitle="已抓取" />
      </div>

      <div className="border border-border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">來源</TableHead>
              <TableHead className="min-w-[200px]">內容</TableHead>
              <TableHead className="w-20">類型</TableHead>
              <TableHead className="w-20">分類</TableHead>
              <TableHead className="w-24 cursor-pointer select-none" onClick={() => handleSort('published_at')}>
                日期<SortIcon active={sortKey === 'published_at'} desc={sortDesc} />
              </TableHead>
              <TableHead className="w-20 cursor-pointer select-none text-right" onClick={() => handleSort('reactions_total')}>
                反應<SortIcon active={sortKey === 'reactions_total'} desc={sortDesc} />
              </TableHead>
              <TableHead className="w-20 cursor-pointer select-none text-right" onClick={() => handleSort('comments_count')}>
                留言<SortIcon active={sortKey === 'comments_count'} desc={sortDesc} />
              </TableHead>
              <TableHead className="w-20 cursor-pointer select-none text-right" onClick={() => handleSort('shares_count')}>
                分享<SortIcon active={sortKey === 'shares_count'} desc={sortDesc} />
              </TableHead>
              <TableHead className="w-24 cursor-pointer select-none text-right" onClick={() => handleSort('engagement_rate')}>
                互動率<SortIcon active={sortKey === 'engagement_rate'} desc={sortDesc} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((post) => (
              <TableRow key={post.id}>
                <TableCell>
                  <Badge variant={post.is_own ? 'default' : 'secondary'} className="text-xs">
                    {post.is_own ? 'AoV' : 'MLBB'}
                  </Badge>
                </TableCell>
                <TableCell><p className="text-sm line-clamp-2">{post.post_text}</p></TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{POST_TYPE_LABELS[post.post_type] || post.post_type}</span></TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{CATEGORY_LABELS[post.post_category] || post.post_category}</Badge></TableCell>
                <TableCell className="text-sm">{post.published_at ? new Date(post.published_at).toLocaleDateString('zh-TW') : '-'}</TableCell>
                <TableCell className="text-right text-sm font-medium">{post.reactions_total.toLocaleString()}</TableCell>
                <TableCell className="text-right text-sm">{post.comments_count.toLocaleString()}</TableCell>
                <TableCell className="text-right text-sm">{post.shares_count.toLocaleString()}</TableCell>
                <TableCell className="text-right text-sm font-medium">{post.engagement_rate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
