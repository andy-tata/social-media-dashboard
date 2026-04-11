import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { analyzeSentiment } from '@/lib/sentiment/analyzer'

export async function POST(request: NextRequest) {
  const webhookSecret = request.headers.get('x-apify-webhook-secret')
  if (webhookSecret !== process.env.APIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await request.json()

    // Apify webhook 格式：payload.resource.defaultDatasetId
    let comments: Record<string, unknown>[] = []

    if (payload.resource?.defaultDatasetId) {
      const datasetId = payload.resource.defaultDatasetId
      const apiToken = process.env.APIFY_API_TOKEN
      const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiToken}`

      const resp = await fetch(datasetUrl)
      if (!resp.ok) {
        throw new Error(`Failed to fetch dataset: ${resp.status}`)
      }
      comments = await resp.json()
    } else {
      comments = Array.isArray(payload) ? payload : payload.data || []
    }

    if (comments.length === 0) {
      return NextResponse.json({ message: 'No comments to process' })
    }

    let inserted = 0

    // 預先載入所有貼文 URL 對照表
    const { data: allPosts } = await supabaseAdmin
      .from('fb_posts')
      .select('id, fb_post_id, post_url') as { data: { id: string; fb_post_id: string; post_url: string | null }[] | null }

    const postUrlMap = new Map<string, string>()
    const postIdMap = new Map<string, string>()
    for (const p of allPosts || []) {
      if (p.post_url) postUrlMap.set(p.post_url, p.id)
      postIdMap.set(p.fb_post_id, p.id)
    }

    for (const comment of comments) {
      const text = (comment.text || comment.message || '') as string
      const sentiment = analyzeSentiment(text)

      // 找到對應的貼文：先用 facebookUrl 匹配，再用 postId
      let postId: string | null = null
      const fbUrl = (comment.facebookUrl || comment.postUrl || '') as string
      if (fbUrl) {
        postId = postUrlMap.get(fbUrl) || null
      }
      if (!postId) {
        const postFbId = (comment.postId || comment.postFbId || '') as string
        if (postFbId) postId = postIdMap.get(postFbId) || null
      }

      if (!postId) continue

      const commentData = {
        post_id: postId,
        fb_comment_id: comment.commentId || comment.id || `cmt_${Date.now()}_${Math.random()}`,
        author_name: comment.authorName || comment.profileName || null,
        comment_text: text || null,
        likes_count: comment.likesCount || comment.likes || 0,
        published_at: comment.date || comment.timestamp || null,
        sentiment_score: sentiment.score,
        sentiment_label: sentiment.label,
        sentiment_topics: sentiment.topics,
        scraped_at: new Date().toISOString(),
      }

      const { error } = await supabaseAdmin
        .from('fb_comments')
        .upsert(commentData as never, { onConflict: 'fb_comment_id' })

      if (!error) inserted++
    }

    await supabaseAdmin.from('scrape_logs').insert({
      scraper_type: 'comments',
      status: 'success',
      records_count: inserted,
      started_at: new Date().toISOString(),
    } as never)

    return NextResponse.json({
      message: `Processed ${comments.length} comments. Inserted: ${inserted}`,
    })
  } catch (error) {
    await supabaseAdmin.from('scrape_logs').insert({
      scraper_type: 'comments',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error',
    } as never)

    return NextResponse.json(
      { error: 'Failed to process comments' },
      { status: 500 }
    )
  }
}
