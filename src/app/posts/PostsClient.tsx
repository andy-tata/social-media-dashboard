'use client'

import { useState, useMemo } from 'react'
import { POST_TYPE_LABELS } from '@/lib/utils/postClassifier'
import { generatePostSummary } from '@/lib/utils/postSummary'
import { translateComment } from '@/lib/utils/commentTranslator'
import { MetricCard } from '@/components/cards/MetricCard'
import { DateRangePicker, getComparisonRange, formatRangeLabel } from '@/components/ui/date-range-picker'
import type { DateRange } from '@/components/ui/date-range-picker'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PostWithPage, CommentWithMeta } from '@/lib/data'

type SortKey = 'published_at' | 'reactions_total' | 'comments_count' | 'shares_count' | 'total_engagement'
type BrandFilter = 'rov' | 'mlbbth'
type MediaFilter = 'all' | 'photo' | 'video'

function formatDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDefaultRange(): DateRange {
  const now = new Date()
  const end = formatDateStr(now)
  const start = new Date(now)
  start.setDate(start.getDate() - 6)
  return { start: formatDateStr(start), end }
}

function filterByRange(posts: PostWithPage[], range: DateRange): PostWithPage[] {
  return posts.filter((p) => {
    if (!p.published_at) return false
    const date = p.published_at.split('T')[0]
    return date >= range.start && date <= range.end
  })
}

function getEngagement(p: PostWithPage) {
  return p.reactions_total + p.comments_count + p.shares_count
}

function calcChange(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0
}

// 可展開文字元件
function ExpandableText({ text, maxLength = 80 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false)
  if (!text) return <span className="text-muted-foreground">（無文字）</span>
  if (text.length <= maxLength) return <span className="break-words whitespace-pre-wrap">{text}</span>
  return (
    <span className="break-words whitespace-pre-wrap">
      {expanded ? text : text.slice(0, maxLength) + '...'}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(!expanded) }}
        className="ml-1 text-blue-500 hover:text-blue-700 text-xs inline"
      >
        {expanded ? '收起' : '展開'}
      </button>
    </span>
  )
}

type Props = {
  posts: PostWithPage[]
  comments: CommentWithMeta[]
}

export function PostsClient({ posts, comments }: Props) {
  const [filter, setFilter] = useState<BrandFilter>('rov')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange)
  const [sortKey, setSortKey] = useState<SortKey>('total_engagement')
  const [sortDesc, setSortDesc] = useState(true)

  const compRange = useMemo(() => getComparisonRange(dateRange), [dateRange])
  const currentLabel = formatRangeLabel(dateRange)
  const compLabel = formatRangeLabel(compRange)

  // 品牌篩選
  const brandPosts = useMemo(() => {
    return posts.filter((p) => filter === 'rov' ? p.is_own : !p.is_own)
  }, [posts, filter])

  // 日期範圍篩選
  const currentPosts = useMemo(() => filterByRange(brandPosts, dateRange), [brandPosts, dateRange])
  const previousPosts = useMemo(() => filterByRange(brandPosts, compRange), [brandPosts, compRange])

  // KPI
  const currentEngagement = currentPosts.reduce((s, p) => s + getEngagement(p), 0)
  const previousEngagement = previousPosts.reduce((s, p) => s + getEngagement(p), 0)

  // 排序 + 類型篩選
  const sorted = useMemo(() => {
    let filtered = currentPosts
    if (mediaFilter !== 'all') filtered = filtered.filter((p) => p.post_type === mediaFilter)
    return [...filtered].sort((a, b) => {
      if (sortKey === 'total_engagement') {
        return sortDesc ? getEngagement(b) - getEngagement(a) : getEngagement(a) - getEngagement(b)
      }
      const aVal = a[sortKey] ?? 0
      const bVal = b[sortKey] ?? 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal)
      }
      return sortDesc ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number)
    })
  }, [currentPosts, sortKey, sortDesc, mediaFilter])

  // Top 5 互動留言：篩選品牌 + 期間內的貼文 ID，再從留言中找
  const top5Comments = useMemo(() => {
    const postIds = new Set(currentPosts.map((p) => p.id))
    return comments
      .filter((c) => {
        if (!postIds.has(c.post_id)) return false
        if (filter === 'rov') return c.is_own
        return !c.is_own
      })
      .sort((a, b) => b.likes_count - a.likes_count)
      .slice(0, 5)
  }, [comments, currentPosts, filter])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(!sortDesc)
    else { setSortKey(key); setSortDesc(true) }
  }

  const SortIcon = ({ active, desc }: { active: boolean; desc: boolean }) => (
    <span className="ml-1 text-xs">{active ? (desc ? '▼' : '▲') : '⇅'}</span>
  )

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* 標題 + 日期選擇器 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">內容表現</h2>
          <p className="text-sm text-muted-foreground mt-1">貼文互動數據分析</p>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* 品牌切換 + 類型篩選 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {([
            { key: 'rov' as const, label: 'ROV' },
            { key: 'mlbbth' as const, label: 'MLBBTH' },
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                filter === item.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex gap-1.5">
          {([
            { key: 'all' as const, label: '全部' },
            { key: 'photo' as const, label: '圖片' },
            { key: 'video' as const, label: '影片' },
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => setMediaFilter(item.key)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-md border transition-colors',
                mediaFilter === item.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:bg-accent'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          title="貼文數"
          value={currentPosts.length}
          change={calcChange(currentPosts.length, previousPosts.length)}
          subtitle={`vs ${compLabel}`}
        />
        <MetricCard
          title="總互動"
          value={currentEngagement.toLocaleString()}
          change={calcChange(currentEngagement, previousEngagement)}
          subtitle={`vs ${compLabel}`}
        />
      </div>

      {/* Top 5 互動留言 */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">Top 5 互動留言 — {currentLabel}</h3>
        </div>
        <div className="divide-y divide-border">
          {top5Comments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              尚無留言資料（需接上留言爬蟲後才會有資料）
            </div>
          ) : (
            top5Comments.map((c, idx) => (
              <div key={c.id} className="p-4 flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground mt-0.5">
                  {idx + 1}
                </span>
                {c.sentiment_label && (
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 text-xs mt-0.5',
                      c.sentiment_label === 'positive' ? 'border-green-300 text-green-700 bg-green-50' :
                      c.sentiment_label === 'negative' ? 'border-red-300 text-red-700 bg-red-50' :
                      'border-gray-300 text-gray-600'
                    )}
                  >
                    {c.sentiment_label === 'positive' ? '正面' : c.sentiment_label === 'negative' ? '負面' : '中立'}
                  </Badge>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{c.comment_text || '（無文字）'}</p>
                  <p className="text-xs text-blue-600 mt-0.5">{translateComment(c.comment_text || '')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.author_name || '匿名'} · {c.published_at ? new Date(c.published_at).toLocaleDateString('zh-TW') : '-'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">{c.likes_count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">讚</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 貼文列表 */}
      <div className="border border-border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-16">圖</TableHead>
              <TableHead className="min-w-[280px]">內容</TableHead>
              <TableHead className="w-20">類型</TableHead>
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
              <TableHead className="w-24 cursor-pointer select-none text-right" onClick={() => handleSort('total_engagement')}>
                互動數<SortIcon active={sortKey === 'total_engagement'} desc={sortDesc} />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((post, idx) => (
              <TableRow key={post.id}>
                <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  {post.media_url ? (
                    <img
                      src={post.media_url}
                      alt=""
                      className="w-12 h-12 rounded object-cover bg-muted"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {POST_TYPE_LABELS[post.post_type]?.[0] || '?'}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-blue-600">{generatePostSummary(post.post_text || '')}</p>
                    <div className="text-sm">
                      {post.post_url ? (
                        <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 hover:underline">
                          <ExpandableText text={post.post_text || ''} />
                        </a>
                      ) : (
                        <ExpandableText text={post.post_text || ''} />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell><span className="text-xs text-muted-foreground">{POST_TYPE_LABELS[post.post_type] || post.post_type}</span></TableCell>
                <TableCell className="text-sm">{post.published_at ? new Date(post.published_at).toLocaleDateString('zh-TW') : '-'}</TableCell>
                <TableCell className="text-right text-sm font-medium">{post.reactions_total.toLocaleString()}</TableCell>
                <TableCell className="text-right text-sm">{post.comments_count.toLocaleString()}</TableCell>
                <TableCell className="text-right text-sm">{post.shares_count.toLocaleString()}</TableCell>
                <TableCell className="text-right text-sm font-medium">{getEngagement(post).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
