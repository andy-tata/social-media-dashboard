import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { classifyPost } from '@/lib/utils/postClassifier'

export async function POST(request: NextRequest) {
  // 驗證 webhook 密鑰
  const webhookSecret = request.headers.get('x-apify-webhook-secret')
  if (webhookSecret !== process.env.APIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json()

    // Apify webhook 格式：payload.resource.defaultDatasetId
    // 需要用 Apify API 去拉 dataset items
    let posts: Record<string, unknown>[] = []

    if (payload.resource?.defaultDatasetId) {
      // Apify webhook 模式：從 dataset 拉資料
      const datasetId = payload.resource.defaultDatasetId
      const apiToken = process.env.APIFY_API_TOKEN
      const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}`

      const resp = await fetch(datasetUrl)
      if (!resp.ok) {
        throw new Error(`Failed to fetch dataset: ${resp.status}`)
      }
      posts = await resp.json()
    } else {
      // 直接傳入 posts 陣列的模式（向後相容）
      posts = Array.isArray(payload) ? payload : payload.data || []
    }

    if (posts.length === 0) {
      return NextResponse.json({ message: 'No posts to process' })
    }

    // 取得粉專對照表
    const { data: pages } = await supabaseAdmin
      .from('fb_pages')
      .select('id, page_id, page_name') as { data: { id: string; page_id: string; page_name: string }[] | null }

    const pageMap = new Map(pages?.map(p => [p.page_id, p.id]) || [])
    const pageNameMap = new Map(pages?.map(p => [p.page_name, p.id]) || [])

    let inserted = 0
    let updated = 0

    for (const post of posts) {
      // 從 Apify 資料中匹配粉專
      const pageId = matchPageId(post, pageMap, pageNameMap)
      if (!pageId) continue

      // Apify 欄位映射
      const reactions = (post.reactions || {}) as Record<string, number>
      const reactionsTotal =
        ((post.topReactionsCount as number) || 0) ||
        ((post.likes as number) || 0)

      const postData = {
        page_id: pageId,
        fb_post_id: (post.postId || post.facebookId || post.id || `${Date.now()}_${Math.random()}`) as string,
        post_url: (post.url || post.postUrl || null) as string | null,
        post_text: (post.text || post.message || null) as string | null,
        post_type: detectPostType(post),
        published_at: (post.time || post.timestamp || post.publishedAt || null) as string | null,
        likes_count: (post.likes || post.likesCount || 0) as number,
        comments_count: (post.comments || post.commentsCount || 0) as number,
        shares_count: (post.shares || post.sharesCount || 0) as number,
        reactions_total: reactionsTotal,
        reaction_like: ((post.reactionLikeCount as number) || reactions.like || 0) as number,
        reaction_love: ((post.reactionLoveCount as number) || reactions.love || 0) as number,
        reaction_haha: ((post.reactionHahaCount as number) || reactions.haha || 0) as number,
        reaction_wow: ((post.reactionWowCount as number) || reactions.wow || 0) as number,
        reaction_sad: ((post.reactionSadCount as number) || reactions.sad || 0) as number,
        reaction_angry: ((post.reactionAngryCount as number) || reactions.angry || 0) as number,
        post_category: classifyPost((post.text || post.message || '') as string),
        media_url: ((post.media as { url?: string }[])?.[0]?.url || post.photoUrl || null) as string | null,
        media_type: detectMediaType(post),
        raw_data: post,
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 計算互動率
      const totalEngagement = postData.reactions_total + postData.comments_count + postData.shares_count

      const fullPostData = {
        ...postData,
        engagement_rate: totalEngagement > 0 ? totalEngagement : null,
      }

      // Upsert：如果已存在就更新指標
      const { error, status } = await supabaseAdmin
        .from('fb_posts')
        .upsert(fullPostData as never, { onConflict: 'fb_post_id' })

      if (!error) {
        if (status === 201) inserted++
        else updated++
      }
    }

    // 紀錄爬蟲執行結果
    await supabaseAdmin.from('scrape_logs').insert({
      scraper_type: 'posts',
      status: 'success',
      records_count: inserted + updated,
      started_at: new Date().toISOString(),
    } as never)

    return NextResponse.json({
      message: `Processed ${posts.length} posts. Inserted: ${inserted}, Updated: ${updated}`,
    })
  } catch (error) {
    await supabaseAdmin.from('scrape_logs').insert({
      scraper_type: 'posts',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    } as never)

    return NextResponse.json(
      { error: 'Failed to process posts' },
      { status: 500 }
    )
  }
}

function matchPageId(
  post: Record<string, unknown>,
  pageMap: Map<string, string>,
  pageNameMap: Map<string, string>
): string | null {
  // 1. 嘗試從 URL 匹配
  const url = (post.facebookUrl || post.pageUrl || post.url || post.inputUrl || '') as string

  for (const [pageSlug, uuid] of pageMap) {
    if (url.toLowerCase().includes(pageSlug.toLowerCase())) {
      return uuid
    }
  }

  // 2. 從 pageName 匹配
  const pageName = (post.pageName || post.pageTitle || (post.user as Record<string, unknown>)?.name || '') as string
  for (const [name, uuid] of pageNameMap) {
    if (pageName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(pageName.toLowerCase())) {
      return uuid
    }
  }

  // 3. 關鍵字匹配
  const urlLower = url.toLowerCase() + ' ' + pageName.toLowerCase()
  if (urlLower.includes('rov') || urlLower.includes('傳說') || urlLower.includes('aov')) {
    return pageMap.get('ROVTH') || null
  }
  if (urlLower.includes('mobilelegends') || urlLower.includes('mlbb')) {
    return pageMap.get('MobileLegendsGameTHLA') || null
  }

  // 4. 預設用第一個粉專
  return pageMap.values().next().value || null
}

function detectPostType(post: Record<string, unknown>): string {
  const media = post.media as { type?: string }[] | undefined
  if (media && media.length > 0) {
    const firstType = media[0]?.type
    if (firstType === 'video' || post.videoUrl) return 'video'
    if (firstType === 'photo' || post.photoUrl) return 'photo'
    return firstType || 'photo'
  }
  if (post.videoUrl) return 'video'
  if (post.photoUrl) return 'photo'
  if (post.link) return 'link'
  return 'text'
}

function detectMediaType(post: Record<string, unknown>): string | null {
  const media = post.media as { type?: string }[] | undefined
  if (media && media.length > 0) return media[0]?.type || 'photo'
  if (post.videoUrl) return 'video'
  if (post.photoUrl) return 'photo'
  return null
}
