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
    const comments = Array.isArray(payload) ? payload : payload.data || []

    if (comments.length === 0) {
      return NextResponse.json({ message: 'No comments to process' })
    }

    let inserted = 0

    for (const comment of comments) {
      const text = comment.text || comment.message || ''
      const sentiment = analyzeSentiment(text)

      // 找到對應的貼文
      const postFbId = comment.postId || comment.postFbId
      let postId: string | null = null

      if (postFbId) {
        const { data: post } = await supabaseAdmin
          .from('fb_posts')
          .select('id')
          .eq('fb_post_id', postFbId as string)
          .single()
        postId = (post as { id: string } | null)?.id || null
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
