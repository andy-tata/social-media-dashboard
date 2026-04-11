// 泰文貼文主題摘要生成器
// 從泰文貼文中識別關鍵主題，產生一行中文說明

type ThemeRule = {
  label: string
  priority: number // 數字越小優先級越高
  keywords: string[]
}

const THEME_RULES: ThemeRule[] = [
  // 高優先：具體活動
  {
    label: '加油卡活動',
    priority: 1,
    keywords: ['เติมน้ำมัน', 'บัตรเติมน้ำมัน', '⛽'],
  },
  {
    label: '潑水節活動',
    priority: 1,
    keywords: ['สงกรานต์', 'Songkran'],
  },
  {
    label: '聯名合作',
    priority: 1,
    keywords: ['คอลแลป', 'collaboration', 'นารูโตะ', 'Naruto', 'LEGENDBACKAGAIN'],
  },

  // 中優先：內容類型
  {
    label: '英雄重製',
    priority: 2,
    keywords: ['โฉมใหม่', 'REVAMPEDHERO', 'รีเวิร์ค', 'revamp'],
  },
  {
    label: '英雄/角色介紹',
    priority: 2,
    keywords: ['ฮีโร่ใหม่', 'ตัวใหม่', 'ตัวละครใหม่', 'สกิล', 'ต้านทานการควบคุม', 'ดาเมจ', 'พุ่งได้', 'AoE'],
  },
  {
    label: '新造型',
    priority: 2,
    keywords: ['สกินใหม่', 'เปิดตัว', 'เอฟเฟกต์', 'Taiyaki', 'Preying Umbra'],
  },
  {
    label: '造型特賣',
    priority: 2,
    keywords: ['ลดราคา', 'ลดราคาสกิน', 'ลดราคาทุกสกิน', 'ร้านค้า'],
  },
  {
    label: '新模式/玩法',
    priority: 2,
    keywords: ['โหมดบันเทิง', 'โหมดใหม่', 'Arccane Brawl', 'โหมด Arccane'],
  },
  {
    label: '遊戲更新',
    priority: 2,
    keywords: ['อัปเดตใหม่', 'อัพเดทใหม่', 'แพทช์ใหม่'],
  },
  {
    label: '電競賽事',
    priority: 2,
    keywords: ['แข่งขัน', 'ทัวร์นาเมนต์', 'Valor City', 'Showmatch', 'showmatch', 'ชิงรางวัล', 'เปิดรับสมัคร'],
  },
  {
    label: 'Rank 賽季',
    priority: 2,
    keywords: ['ซีซันใหม่', 'Rank ซีซัน', 'จัดอันดับ'],
  },

  // 低優先：通用分類
  {
    label: '迷因/趣味',
    priority: 3,
    keywords: ['#funny', '#memes', '😂', '🤣', '😅', '😭', 'กุมขมับ', 'เซ็ง', 'ชายเสื้อส้ม'],
  },
  {
    label: '精彩時刻',
    priority: 3,
    keywords: ['ไฮไลท์', 'highlight', 'คลิปวิดีโอ', 'ตำราพิสดาร'],
  },
  {
    label: '直播預告',
    priority: 3,
    keywords: ['Live', 'ถ่ายทอดสด', 'นัดกัน Live'],
  },
  {
    label: '轉蛋/抽獎',
    priority: 3,
    keywords: ['เปิดกาชา', 'กาชา', 'สุ่ม', 'เสบียงพรีเมียม'],
  },
  {
    label: '社群互動',
    priority: 3,
    keywords: ['คอมเมนต์และแท็ก', 'มาอวด', 'อวดรูป'],
  },
  {
    label: '登入獎勵',
    priority: 4,
    keywords: ['ล็อกอิน', 'ล็อกอินรับ', 'เข้าเกมรับ'],
  },
  {
    label: '活動獎勵',
    priority: 4,
    keywords: ['กิจกรรม', 'ภารกิจ', 'รางวัล', 'แจกฟรี'],
  },
  {
    label: '優惠資訊',
    priority: 5,
    keywords: ['คูปอง', 'โปรโมชัน', 'ลิมิเต็ด'],
  },
]

// 從貼文中提取角色/英雄名稱
const KNOWN_NAMES: { pattern: string; label: string }[] = [
  { pattern: 'Volkath', label: 'Volkath' },
  { pattern: 'Hayate', label: 'Hayate' },
  { pattern: 'Nakroth', label: 'Nakroth' },
  { pattern: 'Flowborn', label: 'Flowborn' },
  { pattern: 'Okka', label: 'Okka' },
  { pattern: "Eland'orr", label: "Eland'orr" },
  { pattern: 'Elandorr', label: "Eland'orr" },
  { pattern: 'LnW', label: 'LnW' },
  { pattern: 'Aulus', label: 'Aulus' },
  { pattern: 'AULUS', label: 'Aulus' },
  { pattern: 'อิทาจิ', label: 'Itachi' },
  { pattern: 'มินาโตะ', label: 'Minato' },
  { pattern: 'นารูโตะ', label: 'Naruto' },
]

export function generatePostSummary(text: string): string {
  if (!text) return '—'

  // 收集所有匹配的主題，按優先級排序
  const matches: { label: string; priority: number }[] = []

  for (const rule of THEME_RULES) {
    for (const kw of rule.keywords) {
      if (text.includes(kw)) {
        // 避免重複標籤
        if (!matches.some((m) => m.label === rule.label)) {
          matches.push({ label: rule.label, priority: rule.priority })
        }
        break
      }
    }
  }

  // 按優先級排序，取最重要的 1-2 個
  matches.sort((a, b) => a.priority - b.priority)

  // 提取角色名稱
  const names = KNOWN_NAMES.filter((n) => text.includes(n.pattern)).map((n) => n.label)
  // 去重
  const uniqueNames = [...new Set(names)]
  const nameStr = uniqueNames.length > 0 ? ` - ${uniqueNames.join('/')}` : ''

  if (matches.length === 0) {
    return uniqueNames.length > 0 ? `遊戲內容${nameStr}` : '社群貼文'
  }

  // 最多 2 個標籤，優先取不同優先級的
  const selected: string[] = [matches[0].label]
  if (matches.length > 1 && matches[1].priority !== matches[0].priority) {
    selected.push(matches[1].label)
  }

  return `${selected.join(' + ')}${nameStr}`
}
