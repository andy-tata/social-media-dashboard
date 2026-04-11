import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // 驗證 Vercel Cron 的授權
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 取最近 2 天的貼文 URL（排除 reel，留言爬蟲不支援）
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const { data: posts } = await supabaseAdmin
      .from('fb_posts')
      .select('post_url')
      .gte('published_at', twoDaysAgo.toISOString())
      .not('post_url', 'is', null)
      .order('published_at', { ascending: false }) as { data: { post_url: string }[] | null }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ message: 'No recent posts found' })
    }

    // 過濾掉 reel URL（留言爬蟲不支援）
    const postUrls = posts
      .filter((p) => p.post_url && !p.post_url.includes('/reel/'))
      .map((p) => ({ url: p.post_url }))

    if (postUrls.length === 0) {
      return NextResponse.json({ message: 'No valid post URLs found' })
    }

    // 觸發 Apify Facebook Comments Scraper
    const actorId = 'us5srxAYnsrkgUv2v'
    const apiToken = process.env.APIFY_API_TOKEN
    if (!apiToken) {
      return NextResponse.json({ error: 'APIFY_API_TOKEN not set' }, { status: 500 })
    }

    const apifyResp = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includeNestedComments: false,
          resultsLimit: 5,
          startUrls: postUrls,
        }),
      }
    )

    if (!apifyResp.ok) {
      const err = await apifyResp.text()
      return NextResponse.json({ error: `Apify API failed: ${err}` }, { status: 500 })
    }

    const runData = await apifyResp.json()

    return NextResponse.json({
      message: `Triggered comments scraper for ${postUrls.length} posts`,
      runId: runData.data?.id,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
