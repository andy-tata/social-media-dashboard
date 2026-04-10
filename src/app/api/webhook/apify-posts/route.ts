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
    const posts = Array.isArray(payload) ? payload : payload.data || []

    if (posts.length === 0) {
      return NextResponse.json({ message: 'No posts to process' })
    }

    // 取得粉專對照表
    const { data: pages } = await supabaseAdmin
      .from('fb_pages')
      .select('id, page_id') as { data: { id: string; page_id: string }[] | null }

    const pageMap = new Map(pages?.map(p => [p.page_id, p.id]) || [])

    let inserted = 0
    let updated = 0

    for (const post of posts) {
      // 從 Apify 資料中提取 page_id
      const pageId = extractPageId(post, pageMap)
      if (!pageId) continue

      const postData = {
        page_id: pageId,
        fb_post_id: post.postId || post.id || `${Date.now()}_${Math.random()}`,
        post_url: post.postUrl || post.url || null,
        post_text: post.text || post.message || null,
        post_type: post.type || 'text',
        published_at: post.time || post.timestamp || post.publishedAt || null,
        likes_count: post.likes || post.likesCount || 0,
        comments_count: post.comments || post.commentsCount || 0,
        shares_count: post.shares || post.sharesCount || 0,
        reactions_total: post.reactionsTotal || post.reactions?.total || post.likes || 0,
        reaction_like: post.reactions?.like || 0,
        reaction_love: post.reactions?.love || 0,
        reaction_haha: post.reactions?.haha || 0,
        reaction_wow: post.reactions?.wow || 0,
        reaction_sad: post.reactions?.sad || 0,
        reaction_angry: post.reactions?.angry || 0,
        post_category: classifyPost(post.text || post.message || ''),
        media_url: post.media?.[0]?.url || post.photoUrl || null,
        media_type: post.media?.[0]?.type || (post.videoUrl ? 'video' : post.photoUrl ? 'photo' : null),
        raw_data: post,
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // 計算互動率（暫時用 reactions + comments + shares 作為分子）
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
    // 紀錄錯誤
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

function extractPageId(post: Record<string, unknown>, pageMap: Map<string, string>): string | null {
  // 嘗試從貼文 URL 或其他欄位提取粉專 ID
  const url = (post.pageUrl || post.postUrl || post.url || '') as string

  for (const [pageSlug, uuid] of pageMap) {
    if (url.toLowerCase().includes(pageSlug.toLowerCase())) {
      return uuid
    }
  }

  // 如果有明確的 pageName 欄位
  const pageName = (post.pageName || post.pageTitle || '') as string
  if (pageName.includes('傳說對決') || pageName.includes('AoV')) {
    return pageMap.get('AoVTW') || null
  }
  if (pageName.includes('Mobile Legends') || pageName.includes('MLBB')) {
    return pageMap.get('mobilelegendsgame') || null
  }

  // 預設用第一個粉專
  return pageMap.values().next().value || null
}
