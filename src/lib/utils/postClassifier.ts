// 貼文類型自動分類器
// 根據貼文內容判斷分類

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  {
    category: 'hero_release',
    keywords: ['新英雄', '英雄登場', '正式上線', '新角色', '技能展示', '英雄介紹'],
  },
  {
    category: 'skin',
    keywords: ['造型', '新造型', '限定造型', '皮膚', '聯名', '合作造型', '星元', '時裝'],
  },
  {
    category: 'esports',
    keywords: ['比賽', '賽事', '冠軍', '戰隊', '選手', 'APL', 'AIC', 'AWC', 'MPL', '聯賽', '電競', '對決'],
  },
  {
    category: 'event',
    keywords: ['活動', '限時', '獎勵', '任務', '簽到', '回饋', '週年', '節日', '福利', '免費'],
  },
  {
    category: 'update',
    keywords: ['更新', '改版', '維護', '版本', '平衡', '調整', '修復', '優化', '公告'],
  },
  {
    category: 'meme',
    keywords: ['迷因', '梗圖', '趣味', '搞笑', '日常', '你是不是也', '有沒有'],
  },
]

export function classifyPost(text: string): string {
  if (!text) return 'other'
  const lowerText = text.toLowerCase()

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return rule.category
      }
    }
  }

  return 'other'
}

// 分類名稱的中文對照
export const CATEGORY_LABELS: Record<string, string> = {
  hero_release: '英雄發佈',
  skin: '造型',
  esports: '電競賽事',
  event: '活動',
  update: '版本更新',
  meme: '社群梗',
  other: '其他',
}

// 貼文類型的中文對照
export const POST_TYPE_LABELS: Record<string, string> = {
  photo: '圖片',
  video: '影片',
  link: '連結',
  text: '純文字',
  album: '相簿',
  reel: 'Reels',
  other: '其他',
}
