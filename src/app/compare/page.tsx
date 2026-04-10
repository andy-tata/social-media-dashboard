'use client'

import { useMemo } from 'react'
import { generateMockPosts, generateMockDailyMetrics } from '@/lib/mockData'
import { MetricCard } from '@/components/cards/MetricCard'
import { EngagementLineChart } from '@/components/charts/EngagementLineChart'
import { ComparisonChart } from '@/components/charts/ComparisonChart'

export default function ComparePage() {
  const posts = useMemo(() => generateMockPosts(), [])
  const dailyMetrics = useMemo(() => generateMockDailyMetrics(), [])

  const aovPosts = posts.filter((p) => p.is_own)
  const mlbbPosts = posts.filter((p) => !p.is_own)

  const aovAvgReactions = aovPosts.reduce((s, p) => s + p.reactions_total, 0) / (aovPosts.length || 1)
  const mlbbAvgReactions = mlbbPosts.reduce((s, p) => s + p.reactions_total, 0) / (mlbbPosts.length || 1)
  const aovAvgEngagement = aovPosts.reduce((s, p) => s + (p.engagement_rate || 0), 0) / (aovPosts.length || 1)
  const mlbbAvgEngagement = mlbbPosts.reduce((s, p) => s + (p.engagement_rate || 0), 0) / (mlbbPosts.length || 1)

  const trendData = dailyMetrics.aov.map((aovDay, i) => ({
    date: aovDay.date,
    aov: aovDay.avg_engagement_rate,
    mlbb: dailyMetrics.mlbb[i]?.avg_engagement_rate || null,
  }))

  const comparisonData = [
    { label: '平均反應數', aov: Math.round(aovAvgReactions), mlbb: Math.round(mlbbAvgReactions) },
    { label: '平均留言數', aov: Math.round(aovPosts.reduce((s, p) => s + p.comments_count, 0) / (aovPosts.length || 1)), mlbb: Math.round(mlbbPosts.reduce((s, p) => s + p.comments_count, 0) / (mlbbPosts.length || 1)) },
    { label: '平均分享數', aov: Math.round(aovPosts.reduce((s, p) => s + p.shares_count, 0) / (aovPosts.length || 1)), mlbb: Math.round(mlbbPosts.reduce((s, p) => s + p.shares_count, 0) / (mlbbPosts.length || 1)) },
  ]

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">競品對標</h2>
        <p className="text-sm text-muted-foreground mt-1">傳說對決 vs MLBB 表現比較</p>
      </div>

      {/* 左右對比 KPI */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-blue-600">傳說對決</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard title="平均互動率" value={`${aovAvgEngagement.toFixed(2)}%`} />
            <MetricCard title="貼文數" value={aovPosts.length} subtitle="近 30 天" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-500">MLBB</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard title="平均互動率" value={`${mlbbAvgEngagement.toFixed(2)}%`} />
            <MetricCard title="貼文數" value={mlbbPosts.length} subtitle="近 30 天" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EngagementLineChart data={trendData} title="互動率趨勢對比" />
        <ComparisonChart data={comparisonData} title="平均互動指標對比" />
      </div>
    </div>
  )
}
