'use client'

import { MetricCard } from '@/components/cards/MetricCard'
import { EngagementLineChart } from '@/components/charts/EngagementLineChart'
import { PostTypeBarChart } from '@/components/charts/PostTypeBarChart'
import { generateMockPosts, generateMockDailyMetrics } from '@/lib/mockData'
import { CATEGORY_LABELS } from '@/lib/utils/postClassifier'
import { Badge } from '@/components/ui/badge'
import { useMemo } from 'react'

export default function DashboardPage() {
  const posts = useMemo(() => generateMockPosts(), [])
  const dailyMetrics = useMemo(() => generateMockDailyMetrics(), [])

  const thisWeekPosts = posts.filter(
    (p) => new Date(p.published_at!).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  )
  const lastWeekPosts = posts.filter((p) => {
    const t = new Date(p.published_at!).getTime()
    return t > Date.now() - 14 * 24 * 60 * 60 * 1000 && t <= Date.now() - 7 * 24 * 60 * 60 * 1000
  })

  // 傳說對決
  const aovThisWeek = thisWeekPosts.filter((p) => p.is_own)
  const aovLastWeek = lastWeekPosts.filter((p) => p.is_own)
  const aovEngagement = aovThisWeek.length > 0
    ? aovThisWeek.reduce((s, p) => s + (p.engagement_rate || 0), 0) / aovThisWeek.length : 0
  const aovLastEngagement = aovLastWeek.length > 0
    ? aovLastWeek.reduce((s, p) => s + (p.engagement_rate || 0), 0) / aovLastWeek.length : 0
  const aovEngagementChange = aovLastEngagement > 0
    ? ((aovEngagement - aovLastEngagement) / aovLastEngagement) * 100 : 0
  const aovTotalInteraction = aovThisWeek.reduce((s, p) => s + p.reactions_total + p.comments_count + p.shares_count, 0)
  const aovLastTotalInteraction = aovLastWeek.reduce((s, p) => s + p.reactions_total + p.comments_count + p.shares_count, 0)
  const aovInteractionChange = aovLastTotalInteraction > 0
    ? ((aovTotalInteraction - aovLastTotalInteraction) / aovLastTotalInteraction) * 100 : 0

  // MLBB
  const mlbbThisWeek = thisWeekPosts.filter((p) => !p.is_own)
  const mlbbLastWeek = lastWeekPosts.filter((p) => !p.is_own)
  const mlbbEngagement = mlbbThisWeek.length > 0
    ? mlbbThisWeek.reduce((s, p) => s + (p.engagement_rate || 0), 0) / mlbbThisWeek.length : 0
  const mlbbLastEngagement = mlbbLastWeek.length > 0
    ? mlbbLastWeek.reduce((s, p) => s + (p.engagement_rate || 0), 0) / mlbbLastWeek.length : 0
  const mlbbEngagementChange = mlbbLastEngagement > 0
    ? ((mlbbEngagement - mlbbLastEngagement) / mlbbLastEngagement) * 100 : 0
  const mlbbTotalInteraction = mlbbThisWeek.reduce((s, p) => s + p.reactions_total + p.comments_count + p.shares_count, 0)
  const mlbbLastTotalInteraction = mlbbLastWeek.reduce((s, p) => s + p.reactions_total + p.comments_count + p.shares_count, 0)
  const mlbbInteractionChange = mlbbLastTotalInteraction > 0
    ? ((mlbbTotalInteraction - mlbbLastTotalInteraction) / mlbbLastTotalInteraction) * 100 : 0

  // 圖表資料
  const trendData = dailyMetrics.aov.map((aovDay, i) => ({
    date: aovDay.date,
    aov: aovDay.avg_engagement_rate,
    mlbb: dailyMetrics.mlbb[i]?.avg_engagement_rate || null,
  }))

  const categoryMap = new Map<string, { aov: number; mlbb: number }>()
  posts.forEach((p) => {
    const cat = p.post_category
    const existing = categoryMap.get(cat) || { aov: 0, mlbb: 0 }
    if (p.is_own) existing.aov++
    else existing.mlbb++
    categoryMap.set(cat, existing)
  })
  const categoryData = Array.from(categoryMap.entries()).map(([key, val]) => ({
    type: CATEGORY_LABELS[key] || key,
    aov: val.aov,
    mlbb: val.mlbb,
  }))

  const recentPosts = posts.slice(0, 8)

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">總覽儀表板</h2>
        <p className="text-sm text-muted-foreground mt-1">Facebook 社群表現一覽 — 傳說對決 vs MLBB</p>
      </div>

      {/* 雙品牌 KPI 對比 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 傳說對決 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-600">傳說對決 — 本週</h3>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              title="貼文數"
              value={aovThisWeek.length}
              change={aovLastWeek.length > 0 ? ((aovThisWeek.length - aovLastWeek.length) / aovLastWeek.length) * 100 : 0}
              subtitle="vs 上週"
            />
            <MetricCard
              title="平均互動率"
              value={`${aovEngagement.toFixed(2)}%`}
              change={aovEngagementChange}
              subtitle="vs 上週"
            />
            <MetricCard
              title="總互動數"
              value={aovTotalInteraction.toLocaleString()}
              change={aovInteractionChange}
              subtitle="vs 上週"
            />
          </div>
        </div>

        {/* MLBB */}
        <div className="rounded-lg border border-red-200 bg-red-50/30 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-red-500">MLBB — 本週</h3>
          <div className="grid grid-cols-3 gap-3">
            <MetricCard
              title="貼文數"
              value={mlbbThisWeek.length}
              change={mlbbLastWeek.length > 0 ? ((mlbbThisWeek.length - mlbbLastWeek.length) / mlbbLastWeek.length) * 100 : 0}
              subtitle="vs 上週"
            />
            <MetricCard
              title="平均互動率"
              value={`${mlbbEngagement.toFixed(2)}%`}
              change={mlbbEngagementChange}
              subtitle="vs 上週"
            />
            <MetricCard
              title="總互動數"
              value={mlbbTotalInteraction.toLocaleString()}
              change={mlbbInteractionChange}
              subtitle="vs 上週"
            />
          </div>
        </div>
      </div>

      {/* 圖表區 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EngagementLineChart data={trendData} />
        <PostTypeBarChart data={categoryData} />
      </div>

      {/* 最新貼文動態 */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold">最新貼文</h3>
        </div>
        <div className="divide-y divide-border">
          {recentPosts.map((post) => (
            <div key={post.id} className="p-4 flex items-start gap-3">
              <Badge variant={post.is_own ? 'default' : 'secondary'} className="shrink-0 text-xs mt-0.5">
                {post.is_own ? 'AoV' : 'MLBB'}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm line-clamp-2">{post.post_text}</p>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  <span>{new Date(post.published_at!).toLocaleDateString('zh-TW')}</span>
                  <span>{post.reactions_total.toLocaleString()} 反應</span>
                  <span>{post.comments_count.toLocaleString()} 留言</span>
                  <span>{post.shares_count.toLocaleString()} 分享</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium">{post.engagement_rate}%</p>
                <p className="text-xs text-muted-foreground">互動率</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
