-- 社群成效分析工具 - 初始資料庫 Schema
-- 在 Supabase SQL Editor 中執行此檔案

-- 1. 追蹤的粉專
CREATE TABLE fb_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  page_url TEXT NOT NULL,
  is_own BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 初始資料：傳說對決 + MLBB
INSERT INTO fb_pages (page_id, page_name, page_url, is_own) VALUES
  ('ROVTH', 'Garena RoV Thailand', 'https://www.facebook.com/ROVTH/', true),
  ('MobileLegendsGameTHLA', 'Mobile Legends: Bang Bang Thailand', 'https://www.facebook.com/MobileLegendsGameTHLA', false);

-- 2. 貼文資料
CREATE TABLE fb_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES fb_pages(id) ON DELETE CASCADE,
  fb_post_id TEXT UNIQUE NOT NULL,
  post_url TEXT,
  post_text TEXT,
  post_type TEXT DEFAULT 'text',
  published_at TIMESTAMPTZ,

  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reactions_total INTEGER DEFAULT 0,
  reaction_like INTEGER DEFAULT 0,
  reaction_love INTEGER DEFAULT 0,
  reaction_haha INTEGER DEFAULT 0,
  reaction_wow INTEGER DEFAULT 0,
  reaction_sad INTEGER DEFAULT 0,
  reaction_angry INTEGER DEFAULT 0,

  engagement_rate REAL,
  post_category TEXT DEFAULT 'other',

  media_url TEXT,
  media_type TEXT,

  scraped_at TIMESTAMPTZ DEFAULT now(),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_page_published ON fb_posts(page_id, published_at DESC);
CREATE INDEX idx_posts_fb_post_id ON fb_posts(fb_post_id);
CREATE INDEX idx_posts_category ON fb_posts(post_category);

-- 3. 留言資料
CREATE TABLE fb_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES fb_posts(id) ON DELETE CASCADE,
  fb_comment_id TEXT UNIQUE,
  author_name TEXT,
  comment_text TEXT,
  likes_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,

  sentiment_score REAL,
  sentiment_label TEXT,
  sentiment_topics TEXT[],

  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_post ON fb_comments(post_id);
CREATE INDEX idx_comments_sentiment ON fb_comments(sentiment_label);

-- 4. 每日彙總指標
CREATE TABLE page_daily_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES fb_pages(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  posts_count INTEGER DEFAULT 0,
  total_reactions INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  avg_engagement_rate REAL,

  positive_comments_pct REAL,
  negative_comments_pct REAL,
  neutral_comments_pct REAL,

  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_id, date)
);

CREATE INDEX idx_daily_page_date ON page_daily_metrics(page_id, date DESC);

-- 5. 活動追蹤
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  tags TEXT[],
  page_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 爬蟲執行紀錄
CREATE TABLE scrape_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scraper_type TEXT NOT NULL,
  page_id UUID REFERENCES fb_pages(id),
  status TEXT NOT NULL,
  records_count INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 預設 View：貼文表現彙總
CREATE VIEW v_post_performance AS
SELECT
  p.*,
  pg.page_name,
  pg.is_own,
  (p.reactions_total + p.comments_count + p.shares_count) AS total_engagement,
  CASE
    WHEN p.published_at > now() - INTERVAL '7 days' THEN 'this_week'
    WHEN p.published_at > now() - INTERVAL '30 days' THEN 'this_month'
    ELSE 'older'
  END AS recency
FROM fb_posts p
JOIN fb_pages pg ON p.page_id = pg.id;

-- 啟用 RLS（Row Level Security）
ALTER TABLE fb_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fb_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- 公開讀取（團隊儀表板不需登入）
CREATE POLICY "公開讀取" ON fb_pages FOR SELECT USING (true);
CREATE POLICY "公開讀取" ON fb_posts FOR SELECT USING (true);
CREATE POLICY "公開讀取" ON fb_comments FOR SELECT USING (true);
CREATE POLICY "公開讀取" ON page_daily_metrics FOR SELECT USING (true);
CREATE POLICY "公開讀取" ON campaigns FOR SELECT USING (true);
CREATE POLICY "公開讀取" ON scrape_logs FOR SELECT USING (true);

-- Service role 可以寫入（webhook 用）
CREATE POLICY "Service 寫入" ON fb_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service 更新" ON fb_posts FOR UPDATE USING (true);
CREATE POLICY "Service 寫入" ON fb_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Service 寫入" ON page_daily_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Service 更新" ON page_daily_metrics FOR UPDATE USING (true);
CREATE POLICY "Service 寫入" ON scrape_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service 寫入" ON campaigns FOR ALL WITH CHECK (true);
