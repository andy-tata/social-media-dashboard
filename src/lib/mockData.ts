// 開發用模擬資料
// 正式接上 Supabase 後可移除

import type { FbPost, PageDailyMetrics, FbComment } from '@/types/database'

const AOV_PAGE_ID = 'aov-mock-id'
const MLBB_PAGE_ID = 'mlbb-mock-id'

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

const POST_TEMPLATES = {
  aov: [
    { text: '全新英雄「艾瑞」即將登場！超華麗技能展示 🔥', category: 'hero_release', type: 'video' },
    { text: '傳說對決 x 鬼滅之刃 聯名造型限時上架！', category: 'skin', type: 'photo' },
    { text: 'APL 2026 春季聯賽 Day3 精彩回顧', category: 'esports', type: 'video' },
    { text: '登入就送！週年慶活動開跑，每日簽到領限定造型', category: 'event', type: 'photo' },
    { text: '4 月份平衡調整公告：5 位英雄調整內容一覽', category: 'update', type: 'link' },
    { text: '你在傳說對決裡最常用的英雄是誰？留言告訴我們！', category: 'meme', type: 'photo' },
    { text: '新手入門必看！5 個讓你快速上分的觀念', category: 'other', type: 'video' },
    { text: '限定造型回歸投票！你最想要哪一款回來？', category: 'skin', type: 'photo' },
  ],
  mlbb: [
    { text: 'New Hero Chip is here! Master the battlefield with your micro-strategies!', category: 'hero_release', type: 'video' },
    { text: 'MLBB x Transformers Collab Skins Available Now!', category: 'skin', type: 'photo' },
    { text: 'MPL Season 14 Grand Finals RECAP 🏆', category: 'esports', type: 'video' },
    { text: 'Free Skin Event! Complete missions to earn exclusive rewards', category: 'event', type: 'photo' },
    { text: 'Patch Notes 1.8.82 - Hero Adjustments and New Features', category: 'update', type: 'link' },
    { text: 'Which role do you main? Drop your answer below! 👇', category: 'meme', type: 'photo' },
    { text: 'Tips & Tricks: How to dominate as a jungler in Season 34', category: 'other', type: 'video' },
    { text: 'Starlight Member Exclusive: April 2026 Skin Preview', category: 'skin', type: 'photo' },
  ],
}

export function generateMockPosts(): (FbPost & { page_name: string; is_own: boolean })[] {
  const posts: (FbPost & { page_name: string; is_own: boolean })[] = []

  for (let i = 0; i < 30; i++) {
    const daysAgo = Math.floor(i / 2)
    const isAov = i % 2 === 0
    const templates = isAov ? POST_TEMPLATES.aov : POST_TEMPLATES.mlbb
    const template = templates[i % templates.length]

    const reactions = randomBetween(isAov ? 200 : 500, isAov ? 3000 : 15000)
    const comments = randomBetween(isAov ? 30 : 100, isAov ? 500 : 3000)
    const shares = randomBetween(isAov ? 10 : 50, isAov ? 200 : 1000)

    posts.push({
      id: `mock-post-${i}`,
      page_id: isAov ? AOV_PAGE_ID : MLBB_PAGE_ID,
      fb_post_id: `fb_${i}_${Date.now()}`,
      post_url: isAov ? `https://facebook.com/AoVTW/posts/${i}` : `https://facebook.com/mobilelegendsgame/posts/${i}`,
      post_text: template.text,
      post_type: template.type,
      published_at: generateDate(daysAgo),
      likes_count: Math.floor(reactions * 0.6),
      comments_count: comments,
      shares_count: shares,
      reactions_total: reactions,
      reaction_like: Math.floor(reactions * 0.6),
      reaction_love: Math.floor(reactions * 0.2),
      reaction_haha: Math.floor(reactions * 0.08),
      reaction_wow: Math.floor(reactions * 0.06),
      reaction_sad: Math.floor(reactions * 0.03),
      reaction_angry: Math.floor(reactions * 0.03),
      engagement_rate: parseFloat(((reactions + comments + shares) / (isAov ? 126000 : 4680000) * 100).toFixed(2)),
      post_category: template.category,
      media_url: null,
      media_type: template.type === 'video' ? 'video' : 'photo',
      scraped_at: new Date().toISOString(),
      raw_data: null,
      created_at: generateDate(daysAgo),
      updated_at: new Date().toISOString(),
      page_name: isAov ? 'Garena RoV Thailand' : 'Mobile Legends: Bang Bang Thailand',
      is_own: isAov,
    })
  }

  return posts.sort((a, b) =>
    new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime()
  )
}

export function generateMockDailyMetrics(): { aov: PageDailyMetrics[]; mlbb: PageDailyMetrics[] } {
  const aov: PageDailyMetrics[] = []
  const mlbb: PageDailyMetrics[] = []

  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    aov.push({
      id: `aov-daily-${i}`,
      page_id: AOV_PAGE_ID,
      date: dateStr,
      posts_count: randomBetween(1, 4),
      total_reactions: randomBetween(800, 5000),
      total_comments: randomBetween(100, 800),
      total_shares: randomBetween(30, 300),
      avg_engagement_rate: parseFloat((randomBetween(15, 45) / 10).toFixed(1)),
      positive_comments_pct: randomBetween(40, 65),
      negative_comments_pct: randomBetween(10, 25),
      neutral_comments_pct: randomBetween(20, 40),
      created_at: new Date().toISOString(),
    })

    mlbb.push({
      id: `mlbb-daily-${i}`,
      page_id: MLBB_PAGE_ID,
      date: dateStr,
      posts_count: randomBetween(2, 6),
      total_reactions: randomBetween(5000, 30000),
      total_comments: randomBetween(500, 5000),
      total_shares: randomBetween(200, 2000),
      avg_engagement_rate: parseFloat((randomBetween(8, 25) / 10).toFixed(1)),
      positive_comments_pct: randomBetween(45, 70),
      negative_comments_pct: randomBetween(8, 20),
      neutral_comments_pct: randomBetween(20, 35),
      created_at: new Date().toISOString(),
    })
  }

  return { aov, mlbb }
}

export function generateMockComments(): FbComment[] {
  const commentTexts = [
    { text: '好期待新英雄！什麼時候上線？', sentiment: 'positive' as const },
    { text: '造型太美了，一定要買！', sentiment: 'positive' as const },
    { text: '又在搶錢了吧，這價格真的太貴', sentiment: 'negative' as const },
    { text: '請問這是限時的嗎？', sentiment: 'neutral' as const },
    { text: '笑死 這技能也太OP了', sentiment: 'positive' as const },
    { text: '拜託修一下閃退的 bug', sentiment: 'negative' as const },
    { text: '@小明 快來看', sentiment: 'neutral' as const },
    { text: '懷念以前的版本...', sentiment: 'neutral' as const },
    { text: '超讚！比賽精彩到不行', sentiment: 'positive' as const },
    { text: '改爛了 要棄坑了', sentiment: 'negative' as const },
    { text: '感覺這英雄會是T0', sentiment: 'neutral' as const },
    { text: '加油 支持傳說對決！', sentiment: 'positive' as const },
  ]

  return commentTexts.map((c, i) => ({
    id: `mock-comment-${i}`,
    post_id: `mock-post-${i % 10}`,
    fb_comment_id: `fb_cmt_${i}`,
    author_name: `User${randomBetween(1000, 9999)}`,
    comment_text: c.text,
    likes_count: randomBetween(0, 50),
    published_at: generateDate(randomBetween(0, 7)),
    sentiment_score: c.sentiment === 'positive' ? 0.7 : c.sentiment === 'negative' ? -0.6 : 0,
    sentiment_label: c.sentiment,
    sentiment_topics: [],
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }))
}
