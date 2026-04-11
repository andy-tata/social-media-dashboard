'use client'

import { useState, useMemo, useCallback } from 'react'
import { DateRangePicker, getComparisonRange, formatRangeLabel } from '@/components/ui/date-range-picker'
import type { DateRange } from '@/components/ui/date-range-picker'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '@/components/cards/MetricCard'
import { generatePostSummary } from '@/lib/utils/postSummary'
import { translateComment } from '@/lib/utils/commentTranslator'
import { cn } from '@/lib/utils'
import type { PostWithPage, CommentWithMeta } from '@/lib/data'
import * as XLSX from 'xlsx'

type Props = {
  posts: PostWithPage[]
  comments: CommentWithMeta[]
}

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

function filterByRange<T extends { published_at?: string | null }>(items: T[], range: DateRange): T[] {
  return items.filter((item) => {
    if (!item.published_at) return false
    const date = item.published_at.split('T')[0]
    return date >= range.start && date <= range.end
  })
}

function getEngagement(p: PostWithPage) {
  return p.reactions_total + p.comments_count + p.shares_count
}

function calcChange(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : 0
}

function calcBrandMetrics(posts: PostWithPage[]) {
  const count = posts.length
  const totalEngagement = posts.reduce((s, p) => s + getEngagement(p), 0)
  const avgEngagement = count > 0 ? Math.round(totalEngagement / count) : 0
  return { count, totalEngagement, avgEngagement }
}

export function ReportsClient({ posts, comments }: Props) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange)

  const compRange = useMemo(() => getComparisonRange(dateRange), [dateRange])
  const currentLabel = formatRangeLabel(dateRange)
  const compLabel = formatRangeLabel(compRange)

  // 貼文篩選
  const currentPosts = useMemo(() => filterByRange(posts, dateRange), [posts, dateRange])
  const previousPosts = useMemo(() => filterByRange(posts, compRange), [posts, compRange])

  // 品牌 KPI
  const rovCurrent = calcBrandMetrics(currentPosts.filter((p) => p.is_own))
  const rovPrevious = calcBrandMetrics(previousPosts.filter((p) => p.is_own))
  const mlbbCurrent = calcBrandMetrics(currentPosts.filter((p) => !p.is_own))
  const mlbbPrevious = calcBrandMetrics(previousPosts.filter((p) => !p.is_own))

  // 情緒概覽
  const sentimentData = useMemo(() => {
    const calc = (posts: PostWithPage[]) => {
      const positive = posts.reduce((s, p) => s + p.reaction_like + p.reaction_love, 0)
      const negative = posts.reduce((s, p) => s + p.reaction_sad + p.reaction_angry, 0)
      const neutral = posts.reduce((s, p) => s + p.reaction_haha + p.reaction_wow, 0)
      const total = positive + negative + neutral
      return {
        positive, negative, neutral, total,
        positivePct: total > 0 ? (positive / total * 100).toFixed(1) : '0',
        negativePct: total > 0 ? (negative / total * 100).toFixed(1) : '0',
        neutralPct: total > 0 ? (neutral / total * 100).toFixed(1) : '0',
      }
    }
    return { rov: calc(currentPosts.filter((p) => p.is_own)), mlbb: calc(currentPosts.filter((p) => !p.is_own)) }
  }, [currentPosts])

  // Top 10 互動貼文
  const top10Posts = useMemo(() => {
    return [...currentPosts].sort((a, b) => getEngagement(b) - getEngagement(a)).slice(0, 10)
  }, [currentPosts])

  // 留言
  const currentComments = useMemo(() => filterByRange(comments, dateRange), [comments, dateRange])
  const positiveComments = currentComments.filter((c) => c.sentiment_label === 'positive').length
  const negativeComments = currentComments.filter((c) => c.sentiment_label === 'negative').length
  const neutralComments = currentComments.filter((c) => c.sentiment_label === 'neutral').length
  const top5Comments = useMemo(() => {
    return [...currentComments].sort((a, b) => b.likes_count - a.likes_count).slice(0, 5)
  }, [currentComments])

  // 分析與建議
  const insights = useMemo(() => {
    const lines: string[] = []

    // 1. 發文量比較
    if (rovCurrent.count > 0 || mlbbCurrent.count > 0) {
      const moreActive = rovCurrent.count >= mlbbCurrent.count ? 'ROV' : 'MLBBTH'
      const lessActive = moreActive === 'ROV' ? 'MLBBTH' : 'ROV'
      const diff = Math.abs(rovCurrent.count - mlbbCurrent.count)
      lines.push(`本期 ${moreActive} 發了 ${Math.max(rovCurrent.count, mlbbCurrent.count)} 篇貼文，比 ${lessActive}（${Math.min(rovCurrent.count, mlbbCurrent.count)} 篇）多 ${diff} 篇。`)
    }

    // 2. 互動效率
    if (rovCurrent.avgEngagement > 0 && mlbbCurrent.avgEngagement > 0) {
      const better = rovCurrent.avgEngagement >= mlbbCurrent.avgEngagement ? 'ROV' : 'MLBBTH'
      const worse = better === 'ROV' ? 'MLBBTH' : 'ROV'
      const ratio = Math.max(rovCurrent.avgEngagement, mlbbCurrent.avgEngagement) / Math.min(rovCurrent.avgEngagement, mlbbCurrent.avgEngagement)
      lines.push(`平均互動數 ${better}（${Math.max(rovCurrent.avgEngagement, mlbbCurrent.avgEngagement).toLocaleString()}）是 ${worse}（${Math.min(rovCurrent.avgEngagement, mlbbCurrent.avgEngagement).toLocaleString()}）的 ${ratio.toFixed(1)} 倍。`)
    }

    // 3. 互動變化趨勢
    const rovEngChange = calcChange(rovCurrent.totalEngagement, rovPrevious.totalEngagement)
    const mlbbEngChange = calcChange(mlbbCurrent.totalEngagement, mlbbPrevious.totalEngagement)
    if (rovPrevious.totalEngagement > 0 || mlbbPrevious.totalEngagement > 0) {
      if (rovEngChange > 0 && mlbbEngChange > 0) {
        lines.push(`兩邊互動都在成長，ROV ${rovEngChange > 0 ? '+' : ''}${rovEngChange.toFixed(1)}%，MLBBTH ${mlbbEngChange > 0 ? '+' : ''}${mlbbEngChange.toFixed(1)}%。`)
      } else if (rovEngChange > 0 && mlbbEngChange <= 0) {
        lines.push(`ROV 互動成長 +${rovEngChange.toFixed(1)}%，而 MLBBTH 下滑 ${mlbbEngChange.toFixed(1)}%，ROV 本期表現佔優。`)
      } else if (rovEngChange <= 0 && mlbbEngChange > 0) {
        lines.push(`MLBBTH 互動成長 +${mlbbEngChange.toFixed(1)}%，而 ROV 下滑 ${rovEngChange.toFixed(1)}%，需關注 ROV 內容策略。`)
      } else {
        lines.push(`兩邊互動都在下滑（ROV ${rovEngChange.toFixed(1)}%，MLBBTH ${mlbbEngChange.toFixed(1)}%），建議檢視內容方向。`)
      }
    }

    // 4. 最佳貼文洞察
    if (top10Posts.length > 0) {
      const best = top10Posts[0]
      const summary = generatePostSummary(best.post_text || '')
      lines.push(`本期互動最高的貼文來自 ${best.is_own ? 'ROV' : 'MLBBTH'}，主題為「${summary}」，互動數 ${getEngagement(best).toLocaleString()}。`)

      // 看看 top 10 裡哪個主題出現最多
      const themeCounts = new Map<string, number>()
      top10Posts.forEach((p) => {
        const s = generatePostSummary(p.post_text || '')
        const mainTheme = s.split(' + ')[0].split(' - ')[0]
        themeCounts.set(mainTheme, (themeCounts.get(mainTheme) || 0) + 1)
      })
      const topTheme = [...themeCounts.entries()].sort((a, b) => b[1] - a[1])[0]
      if (topTheme && topTheme[1] >= 2) {
        lines.push(`高互動貼文中「${topTheme[0]}」相關主題出現 ${topTheme[1]} 次，是目前最受粉絲歡迎的內容方向。`)
      }
    }

    // 5. 影片 vs 圖片
    const videoCount = currentPosts.filter((p) => p.post_type === 'video').length
    const photoCount = currentPosts.filter((p) => p.post_type === 'photo').length
    if (videoCount > 0 && photoCount > 0) {
      const videoAvg = Math.round(currentPosts.filter((p) => p.post_type === 'video').reduce((s, p) => s + getEngagement(p), 0) / videoCount)
      const photoAvg = Math.round(currentPosts.filter((p) => p.post_type === 'photo').reduce((s, p) => s + getEngagement(p), 0) / photoCount)
      const betterType = videoAvg >= photoAvg ? '影片' : '圖片'
      lines.push(`${betterType}貼文的平均互動（${Math.max(videoAvg, photoAvg).toLocaleString()}）高於${betterType === '影片' ? '圖片' : '影片'}（${Math.min(videoAvg, photoAvg).toLocaleString()}），建議多製作${betterType}內容。`)
    }

    // 6. 留言情緒
    if (currentComments.length > 0) {
      const negPct = (negativeComments / currentComments.length * 100).toFixed(0)
      if (negativeComments / currentComments.length > 0.3) {
        lines.push(`留言負面比例偏高（${negPct}%），建議關注粉絲反饋，適時回應或調整策略。`)
      } else {
        lines.push(`留言情緒整體正面（負面僅 ${negPct}%），粉絲對近期內容反應良好。`)
      }
    }

    return lines
  }, [currentPosts, rovCurrent, rovPrevious, mlbbCurrent, mlbbPrevious, top10Posts, currentComments, negativeComments])

  // 匯出 Excel
  const exportExcel = useCallback(() => {
    const wb = XLSX.utils.book_new()

    // 工作表 1：總覽
    const overviewData = [
      [`ROV vs MLBBTH 社群分析報告`, '', '', ''],
      ['期間', `${dateRange.start} ~ ${dateRange.end}`, '比較期間', `${compRange.start} ~ ${compRange.end}`],
      [''],
      ['指標', 'ROV', 'MLBBTH', ''],
      ['貼文數', rovCurrent.count, mlbbCurrent.count, ''],
      ['總互動', rovCurrent.totalEngagement, mlbbCurrent.totalEngagement, ''],
      ['平均互動', rovCurrent.avgEngagement, mlbbCurrent.avgEngagement, ''],
      ['貼文數變化率', `${calcChange(rovCurrent.count, rovPrevious.count).toFixed(1)}%`, `${calcChange(mlbbCurrent.count, mlbbPrevious.count).toFixed(1)}%`, ''],
      ['總互動變化率', `${calcChange(rovCurrent.totalEngagement, rovPrevious.totalEngagement).toFixed(1)}%`, `${calcChange(mlbbCurrent.totalEngagement, mlbbPrevious.totalEngagement).toFixed(1)}%`, ''],
      [''],
      ['反應情緒', 'ROV', 'MLBBTH', ''],
      ['正面 (Like+Love)', `${sentimentData.rov.positivePct}%`, `${sentimentData.mlbb.positivePct}%`, ''],
      ['中立 (Haha+Wow)', `${sentimentData.rov.neutralPct}%`, `${sentimentData.mlbb.neutralPct}%`, ''],
      ['負面 (Sad+Angry)', `${sentimentData.rov.negativePct}%`, `${sentimentData.mlbb.negativePct}%`, ''],
      [''],
      ['留言情緒', '數量', '百分比', ''],
      ['正面', positiveComments, currentComments.length > 0 ? `${(positiveComments / currentComments.length * 100).toFixed(1)}%` : '0%', ''],
      ['負面', negativeComments, currentComments.length > 0 ? `${(negativeComments / currentComments.length * 100).toFixed(1)}%` : '0%', ''],
      ['中立', neutralComments, currentComments.length > 0 ? `${(neutralComments / currentComments.length * 100).toFixed(1)}%` : '0%', ''],
      ['合計', currentComments.length, '', ''],
      [''],
      ['分析與建議', '', '', ''],
      ...insights.map((line, i) => [`${i + 1}. ${line}`, '', '', '']),
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(overviewData)
    ws1['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, ws1, '總覽')

    // 工作表 2：貼文明細
    const postRows = currentPosts
      .sort((a, b) => getEngagement(b) - getEngagement(a))
      .map((p) => ({
        '品牌': p.is_own ? 'ROV' : 'MLBBTH',
        '日期': p.published_at?.split('T')[0] || '',
        '主題摘要': generatePostSummary(p.post_text || ''),
        '類型': p.post_type === 'video' ? '影片' : '圖片',
        '內容': p.post_text || '',
        '反應數': p.reactions_total,
        '留言數': p.comments_count,
        '分享數': p.shares_count,
        '總互動': getEngagement(p),
        '連結': p.post_url || '',
      }))
    const ws2 = XLSX.utils.json_to_sheet(postRows)
    ws2['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 6 }, { wch: 50 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(wb, ws2, '貼文明細')

    // 工作表 3：留言明細
    if (currentComments.length > 0) {
      const commentRows = currentComments.map((c) => ({
        '品牌': c.is_own ? 'ROV' : 'MLBBTH',
        '日期': c.published_at?.split('T')[0] || '',
        '作者': c.author_name || '',
        '留言內容': c.comment_text || '',
        '中文翻譯': translateComment(c.comment_text || ''),
        '情緒': c.sentiment_label === 'positive' ? '正面' : c.sentiment_label === 'negative' ? '負面' : '中立',
        '讚數': c.likes_count,
        '原文連結': c.post_url || '',
      }))
      const ws3 = XLSX.utils.json_to_sheet(commentRows)
      ws3['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 50 }, { wch: 30 }, { wch: 6 }, { wch: 6 }, { wch: 40 }]
      XLSX.utils.book_append_sheet(wb, ws3, '留言明細')
    }

    XLSX.writeFile(wb, `ROV_vs_MLBBTH_社群分析報告_${dateRange.start}_${dateRange.end}.xlsx`)
  }, [dateRange, compRange, currentPosts, currentComments, rovCurrent, rovPrevious, mlbbCurrent, mlbbPrevious, sentimentData, positiveComments, negativeComments, neutralComments])

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* 標題 + 日期 + 匯出 */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">ROV vs MLBBTH 社群分析報告</h2>
          <p className="text-sm text-muted-foreground mt-1">{dateRange.start} ~ {dateRange.end}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <button
            onClick={exportExcel}
            className="px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            匯出 Excel
          </button>
        </div>
      </div>

      {/* Section 1：總覽 KPI */}
      <div>
        <h3 className="text-sm font-semibold mb-3">總覽 KPI — {currentLabel}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-blue-600">ROV</h4>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard title="貼文數" value={rovCurrent.count} change={calcChange(rovCurrent.count, rovPrevious.count)} subtitle={`vs ${compLabel}`} />
              <MetricCard title="平均互動" value={rovCurrent.avgEngagement.toLocaleString()} change={calcChange(rovCurrent.avgEngagement, rovPrevious.avgEngagement)} subtitle={`vs ${compLabel}`} />
              <MetricCard title="總互動" value={rovCurrent.totalEngagement.toLocaleString()} change={calcChange(rovCurrent.totalEngagement, rovPrevious.totalEngagement)} subtitle={`vs ${compLabel}`} />
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-red-500">MLBBTH</h4>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard title="貼文數" value={mlbbCurrent.count} change={calcChange(mlbbCurrent.count, mlbbPrevious.count)} subtitle={`vs ${compLabel}`} />
              <MetricCard title="平均互動" value={mlbbCurrent.avgEngagement.toLocaleString()} change={calcChange(mlbbCurrent.avgEngagement, mlbbPrevious.avgEngagement)} subtitle={`vs ${compLabel}`} />
              <MetricCard title="總互動" value={mlbbCurrent.totalEngagement.toLocaleString()} change={calcChange(mlbbCurrent.totalEngagement, mlbbPrevious.totalEngagement)} subtitle={`vs ${compLabel}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2：情緒概覽 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">反應情緒概覽</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'ROV', color: 'text-blue-600', data: sentimentData.rov },
              { label: 'MLBBTH', color: 'text-red-500', data: sentimentData.mlbb },
            ].map(({ label, color, data }) => (
              <div key={label} className="space-y-2">
                <span className={`text-sm font-semibold ${color}`}>{label}</span>
                <div className="h-5 rounded-full overflow-hidden flex bg-muted">
                  {data.total > 0 && (
                    <>
                      <div className="bg-green-500 h-full" style={{ width: `${data.positivePct}%` }} />
                      <div className="bg-amber-400 h-full" style={{ width: `${data.neutralPct}%` }} />
                      <div className="bg-red-500 h-full" style={{ width: `${data.negativePct}%` }} />
                    </>
                  )}
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600">正面 {data.positivePct}%</span>
                  <span className="text-amber-600">中立 {data.neutralPct}%</span>
                  <span className="text-red-500">負面 {data.negativePct}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 3：Top 10 互動貼文 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top 10 互動貼文</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {top10Posts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">此期間沒有貼文資料</p>
            ) : (
              top10Posts.map((post, idx) => (
                <div key={post.id} className="py-3 flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground mt-0.5">
                    {idx + 1}
                  </span>
                  {post.media_url ? (
                    <img src={post.media_url} alt="" className="w-10 h-10 rounded object-cover bg-muted shrink-0" loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant={post.is_own ? 'default' : 'secondary'} className="text-xs">
                        {post.is_own ? 'ROV' : 'MLBBTH'}
                      </Badge>
                      <span className="text-xs text-blue-600 font-medium">{generatePostSummary(post.post_text || '')}</span>
                    </div>
                    {post.post_url ? (
                      <a href={post.post_url} target="_blank" rel="noopener noreferrer" className="text-sm line-clamp-1 hover:text-blue-600 hover:underline">
                        {post.post_text || '（無文字）'}
                      </a>
                    ) : (
                      <p className="text-sm line-clamp-1">{post.post_text || '（無文字）'}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{getEngagement(post).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">互動</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 4：留言情緒 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">留言情緒分佈</CardTitle>
        </CardHeader>
        <CardContent>
          {currentComments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">尚無留言資料</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-lg font-bold text-green-700">{currentComments.length > 0 ? (positiveComments / currentComments.length * 100).toFixed(0) : 0}%</p>
                  <p className="text-xs text-green-600">正面 ({positiveComments})</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-lg font-bold text-red-700">{currentComments.length > 0 ? (negativeComments / currentComments.length * 100).toFixed(0) : 0}%</p>
                  <p className="text-xs text-red-600">負面 ({negativeComments})</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-lg font-bold text-gray-700">{currentComments.length > 0 ? (neutralComments / currentComments.length * 100).toFixed(0) : 0}%</p>
                  <p className="text-xs text-gray-600">中立 ({neutralComments})</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-lg font-bold text-blue-700">{currentComments.length}</p>
                  <p className="text-xs text-blue-600">總留言數</p>
                </div>
              </div>

              {top5Comments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Top 5 互動留言</h4>
                  <div className="divide-y divide-border">
                    {top5Comments.map((c, idx) => (
                      <div key={c.id} className="py-2 flex items-start gap-2">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground mt-0.5">
                          {idx + 1}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('shrink-0 text-[10px]',
                            c.sentiment_label === 'positive' ? 'border-green-300 text-green-700 bg-green-50' :
                            c.sentiment_label === 'negative' ? 'border-red-300 text-red-700 bg-red-50' :
                            'border-gray-300 text-gray-600'
                          )}
                        >
                          {c.sentiment_label === 'positive' ? '正' : c.sentiment_label === 'negative' ? '負' : '中'}
                        </Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{c.comment_text}</p>
                          <p className="text-xs text-blue-600">{translateComment(c.comment_text || '')}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            <span>{c.author_name}</span>
                            <span>{c.likes_count} 讚</span>
                            {c.post_url && <a href={c.post_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">查看原文</a>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 5：分析與建議 */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">分析與建議</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {insights.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
