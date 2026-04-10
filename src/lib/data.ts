import { supabaseAdmin } from '@/lib/supabase/server'
import type { FbPost, FbComment } from '@/types/database'

export type PostWithPage = FbPost & { page_name: string; is_own: boolean }

export async function fetchPosts(): Promise<PostWithPage[]> {
  const { data: pages } = await supabaseAdmin
    .from('fb_pages')
    .select('id, page_name, is_own')

  const pageMap = new Map(
    (pages || []).map((p: { id: string; page_name: string; is_own: boolean }) => [p.id, p])
  )

  const { data: posts } = await supabaseAdmin
    .from('fb_posts')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(100)

  if (!posts || posts.length === 0) return []

  return (posts as FbPost[]).map((post) => {
    const page = pageMap.get(post.page_id)
    return {
      ...post,
      page_name: page?.page_name || 'Unknown',
      is_own: page?.is_own || false,
    }
  })
}

export async function fetchComments(): Promise<(FbComment & { is_own: boolean })[]> {
  const { data: pages } = await supabaseAdmin
    .from('fb_pages')
    .select('id, is_own')

  const pageMap = new Map(
    (pages || []).map((p: { id: string; is_own: boolean }) => [p.id, p.is_own])
  )

  const { data: posts } = await supabaseAdmin
    .from('fb_posts')
    .select('id, page_id')

  const postPageMap = new Map(
    (posts || []).map((p: { id: string; page_id: string }) => [p.id, p.page_id])
  )

  const { data: comments } = await supabaseAdmin
    .from('fb_comments')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(200)

  if (!comments || comments.length === 0) return []

  return (comments as FbComment[]).map((c) => {
    const pageId = postPageMap.get(c.post_id)
    return {
      ...c,
      is_own: pageId ? (pageMap.get(pageId) || false) : false,
    }
  })
}

export type DailyMetricRow = {
  date: string
  aov_engagement: number | null
  mlbb_engagement: number | null
  aov_reactions: number
  mlbb_reactions: number
  aov_comments: number
  mlbb_comments: number
  aov_shares: number
  mlbb_shares: number
}

export async function fetchDailyTrend(posts: PostWithPage[]): Promise<DailyMetricRow[]> {
  // Group posts by date and brand
  const dateMap = new Map<string, { aov: PostWithPage[]; mlbb: PostWithPage[] }>()

  for (const p of posts) {
    if (!p.published_at) continue
    const date = p.published_at.split('T')[0]
    const entry = dateMap.get(date) || { aov: [], mlbb: [] }
    if (p.is_own) entry.aov.push(p)
    else entry.mlbb.push(p)
    dateMap.set(date, entry)
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { aov, mlbb }]) => {
      const aovEng = aov.length > 0
        ? aov.reduce((s, p) => s + (p.engagement_rate || 0), 0) / aov.length
        : null
      const mlbbEng = mlbb.length > 0
        ? mlbb.reduce((s, p) => s + (p.engagement_rate || 0), 0) / mlbb.length
        : null

      return {
        date,
        aov_engagement: aovEng,
        mlbb_engagement: mlbbEng,
        aov_reactions: aov.reduce((s, p) => s + p.reactions_total, 0),
        mlbb_reactions: mlbb.reduce((s, p) => s + p.reactions_total, 0),
        aov_comments: aov.reduce((s, p) => s + p.comments_count, 0),
        mlbb_comments: mlbb.reduce((s, p) => s + p.comments_count, 0),
        aov_shares: aov.reduce((s, p) => s + p.shares_count, 0),
        mlbb_shares: mlbb.reduce((s, p) => s + p.shares_count, 0),
      }
    })
}
