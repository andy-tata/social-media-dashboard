// 泰文留言簡易中文摘要
// 用關鍵字比對產生粗略的中文翻譯，讓不懂泰文的人能快速理解大意

const THAI_TO_ZH: { pattern: string; zh: string }[] = [
  // 正面表達
  { pattern: 'สวยมาก', zh: '超好看' },
  { pattern: 'สวย', zh: '好看' },
  { pattern: 'เท่มาก', zh: '超帥' },
  { pattern: 'เท่', zh: '帥' },
  { pattern: 'ชอบมาก', zh: '很喜歡' },
  { pattern: 'ชอบ', zh: '喜歡' },
  { pattern: 'ดีมาก', zh: '很好' },
  { pattern: 'ดีจัง', zh: '真不錯' },
  { pattern: 'ดี', zh: '好' },
  { pattern: 'เยี่ยม', zh: '讚' },
  { pattern: 'เจ๋ง', zh: '厲害' },
  { pattern: 'ปังมาก', zh: '超讚' },
  { pattern: 'ปัง', zh: '讚' },
  { pattern: 'สุดยอด', zh: '太棒了' },
  { pattern: 'โคตร', zh: '超級' },
  { pattern: 'มันส์มาก', zh: '超爽' },
  { pattern: 'มันส์', zh: '爽' },
  { pattern: 'สนุกมาก', zh: '超好玩' },
  { pattern: 'สนุก', zh: '好玩' },
  { pattern: 'น่ารักมาก', zh: '超可愛' },
  { pattern: 'น่ารัก', zh: '可愛' },
  { pattern: 'เก่งมาก', zh: '超厲害' },
  { pattern: 'เก่ง', zh: '厲害' },

  // 購買/想要
  { pattern: 'อยากได้', zh: '想要' },
  { pattern: 'อยากซื้อ', zh: '想買' },
  { pattern: 'ซื้อแน่', zh: '一定買' },
  { pattern: 'คุ้มมาก', zh: '很划算' },
  { pattern: 'คุ้ม', zh: '划算' },
  { pattern: 'จัดเลย', zh: '買了' },
  { pattern: 'เอาเลย', zh: '要了' },

  // 感謝
  { pattern: 'ขอบคุณ', zh: '謝謝' },
  { pattern: 'ทีมงาน', zh: '團隊' },

  // 負面表達
  { pattern: 'แพงมาก', zh: '超貴' },
  { pattern: 'แพงไป', zh: '太貴' },
  { pattern: 'แพง', zh: '貴' },
  { pattern: 'ดูดเงิน', zh: '吸金' },
  { pattern: 'กากมาก', zh: '超爛' },
  { pattern: 'กาก', zh: '爛' },
  { pattern: 'ห่วยมาก', zh: '超差' },
  { pattern: 'ห่วย', zh: '差' },
  { pattern: 'แย่มาก', zh: '很差' },
  { pattern: 'แย่', zh: '差' },
  { pattern: 'น่าเบื่อ', zh: '無聊' },
  { pattern: 'เบื่อ', zh: '煩' },
  { pattern: 'ผิดหวัง', zh: '失望' },
  { pattern: 'เซ็ง', zh: '煩躁' },
  { pattern: 'เกมตาย', zh: '遊戲已死' },
  { pattern: 'เลิกเล่น', zh: '不玩了' },
  { pattern: 'ลบเกม', zh: '刪遊戲' },
  { pattern: 'โกง', zh: '作弊' },
  { pattern: 'ไม่แฟร์', zh: '不公平' },

  // 技術問題
  { pattern: 'แลคหนัก', zh: 'lag 嚴重' },
  { pattern: 'แลค', zh: 'lag' },
  { pattern: 'กระตุก', zh: '卡頓' },
  { pattern: 'บัค', zh: 'bug' },
  { pattern: 'บั๊ก', zh: 'bug' },
  { pattern: 'bug', zh: 'bug' },
  { pattern: 'แก้', zh: '修' },
  { pattern: 'เข้าไม่ได้', zh: '進不去' },
  { pattern: 'เด้ง', zh: '閃退' },

  // 遊戲相關
  { pattern: 'โดนเนิร์ฟ', zh: '被削弱' },
  { pattern: 'อ่อนมาก', zh: '太弱' },
  { pattern: 'อ่อน', zh: '弱' },
  { pattern: 'OP มาก', zh: '超 OP' },
  { pattern: 'ตัวใหม่', zh: '新角色' },
  { pattern: 'สกิน', zh: '造型' },
  { pattern: 'สกินใหม่', zh: '新造型' },
  { pattern: 'อีเวนต์', zh: '活動' },
  { pattern: 'กิจกรรม', zh: '活動' },
  { pattern: 'รางวัล', zh: '獎勵' },
  { pattern: 'คูปอง', zh: '優惠券' },

  // 中性
  { pattern: 'เดา', zh: '猜' },
  { pattern: 'น่าจะ', zh: '應該' },
  { pattern: 'รอดู', zh: '觀望' },
  { pattern: 'ยังไม่แน่ใจ', zh: '還不確定' },
  { pattern: 'มาเล่น', zh: '來玩' },
  { pattern: 'ด้วยกัน', zh: '一起' },
  { pattern: 'เมื่อไหร่', zh: '什麼時候' },
  { pattern: 'ทำไม', zh: '為什麼' },
  { pattern: 'ไม่มี', zh: '沒有' },
  { pattern: 'ใหม่', zh: '新的' },
  { pattern: 'เยอะ', zh: '很多' },

  // 語氣
  { pattern: '5555', zh: '哈哈哈' },
  { pattern: '555', zh: '哈哈' },
  { pattern: 'จริงๆ', zh: '真的' },
  { pattern: 'สักที', zh: '拜託' },
  { pattern: 'หนักเกิน', zh: '太過分' },
  { pattern: 'มาก', zh: '很' },
  { pattern: 'เลย', zh: '了' },
  { pattern: 'ครับ', zh: '' },
  { pattern: 'ค่ะ', zh: '' },
  { pattern: 'นะ', zh: '' },
]

export function translateComment(text: string): string {
  if (!text) return ''

  const parts: string[] = []
  let remaining = text

  // 貪心比對：從最長的 pattern 開始找
  const sortedPatterns = [...THAI_TO_ZH].sort((a, b) => b.pattern.length - a.pattern.length)

  while (remaining.length > 0) {
    let matched = false
    for (const { pattern, zh } of sortedPatterns) {
      if (remaining.startsWith(pattern)) {
        if (zh) parts.push(zh)
        remaining = remaining.slice(pattern.length).trimStart()
        matched = true
        break
      }
    }
    if (!matched) {
      // 跳過一個字元（包含泰文字、emoji、英文等）
      const char = remaining[0]
      // 保留 @mentions 和英文單字
      if (char === '@') {
        const mentionMatch = remaining.match(/^@\S+/)
        if (mentionMatch) {
          parts.push(mentionMatch[0])
          remaining = remaining.slice(mentionMatch[0].length).trimStart()
          continue
        }
      }
      remaining = remaining.slice(1)
    }
  }

  const result = parts.join(' ').replace(/\s+/g, ' ').trim()
  return result || '（無法辨識）'
}
