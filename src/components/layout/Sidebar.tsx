'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: '總覽', icon: '📊' },
  { href: '/posts', label: '內容表現', icon: '📝' },
  { href: '/sentiment', label: '情緒分析', icon: '💬' },
  { href: '/reports', label: '報表產出', icon: '📋' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:border-r lg:border-border bg-card">
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-bold">社群成效分析</h1>
        <p className="text-xs text-muted-foreground mt-1">ROV vs MLBBTH</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          最後更新：資料載入中...
        </p>
      </div>
    </aside>
  )
}
