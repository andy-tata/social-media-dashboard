export type Database = {
  public: {
    Tables: {
      fb_pages: {
        Row: {
          id: string
          page_id: string
          page_name: string
          page_url: string
          is_own: boolean
          created_at: string
        }
        Insert: Omit<FbPage, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<FbPage>
      }
      fb_posts: {
        Row: FbPost
        Insert: Omit<FbPost, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<FbPost>
      }
      fb_comments: {
        Row: FbComment
        Insert: Omit<FbComment, 'id' | 'created_at'> & { id?: string }
        Update: Partial<FbComment>
      }
      page_daily_metrics: {
        Row: PageDailyMetrics
        Insert: Omit<PageDailyMetrics, 'id' | 'created_at'> & { id?: string }
        Update: Partial<PageDailyMetrics>
      }
      campaigns: {
        Row: Campaign
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Campaign>
      }
      scrape_logs: {
        Row: ScrapeLog
        Insert: Omit<ScrapeLog, 'id' | 'completed_at'> & { id?: string }
        Update: Partial<ScrapeLog>
      }
    }
    Views: {
      v_post_performance: {
        Row: FbPost & {
          page_name: string
          is_own: boolean
          total_engagement: number
          recency: 'this_week' | 'this_month' | 'older'
        }
      }
    }
  }
}

export type FbPage = {
  id: string
  page_id: string
  page_name: string
  page_url: string
  is_own: boolean
  created_at: string
}

export type FbPost = {
  id: string
  page_id: string
  fb_post_id: string
  post_url: string | null
  post_text: string | null
  post_type: string
  published_at: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  reactions_total: number
  reaction_like: number
  reaction_love: number
  reaction_haha: number
  reaction_wow: number
  reaction_sad: number
  reaction_angry: number
  engagement_rate: number | null
  post_category: string
  media_url: string | null
  media_type: string | null
  scraped_at: string
  raw_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export type FbComment = {
  id: string
  post_id: string
  fb_comment_id: string | null
  author_name: string | null
  comment_text: string | null
  likes_count: number
  published_at: string | null
  sentiment_score: number | null
  sentiment_label: 'positive' | 'negative' | 'neutral' | null
  sentiment_topics: string[] | null
  scraped_at: string
  created_at: string
}

export type PageDailyMetrics = {
  id: string
  page_id: string
  date: string
  posts_count: number
  total_reactions: number
  total_comments: number
  total_shares: number
  avg_engagement_rate: number | null
  positive_comments_pct: number | null
  negative_comments_pct: number | null
  neutral_comments_pct: number | null
  created_at: string
}

export type Campaign = {
  id: string
  name: string
  description: string | null
  start_date: string
  end_date: string
  tags: string[] | null
  page_ids: string[] | null
  created_at: string
  updated_at: string
}

export type ScrapeLog = {
  id: string
  scraper_type: string
  page_id: string | null
  status: 'success' | 'partial' | 'failed'
  records_count: number
  error_message: string | null
  started_at: string | null
  completed_at: string
}

// 圖表用的衍生類型
export type PostPerformance = Database['public']['Views']['v_post_performance']['Row']

export type EngagementTrend = {
  date: string
  aov_engagement: number | null
  mlbb_engagement: number | null
}

export type SentimentSummary = {
  positive: number
  negative: number
  neutral: number
  total: number
}

export type PostTypeStat = {
  type: string
  count: number
  avg_engagement: number
}
