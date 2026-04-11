'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export type DateRange = {
  start: string // YYYY-MM-DD
  end: string   // YYYY-MM-DD
}

type DateRangePickerProps = {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
}

const PRESETS = [
  { label: '今天', days: 0 },
  { label: '近 7 天', days: 7 },
  { label: '近 14 天', days: 14 },
  { label: '近 30 天', days: 30 },
] as const

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getPresetRange(days: number): DateRange {
  const now = new Date()
  const end = formatDate(now)
  if (days === 0) return { start: end, end }
  const start = new Date(now)
  start.setDate(start.getDate() - days + 1)
  return { start: formatDate(start), end }
}

function matchPreset(range: DateRange): number | null {
  const endDate = new Date(range.end)
  const startDate = new Date(range.start)
  const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (86400000)) + 1
  const today = formatDate(new Date())

  if (range.end !== today) return null
  if (diffDays === 1) return 0
  if (diffDays === 7) return 7
  if (diffDays === 14) return 14
  if (diffDays === 30) return 30
  return null
}

export function getComparisonRange(range: DateRange): DateRange {
  const start = new Date(range.start)
  const end = new Date(range.end)
  const lengthMs = end.getTime() - start.getTime() + 86400000 // 含當天
  const compEnd = new Date(start.getTime() - 86400000) // 前一天
  const compStart = new Date(compEnd.getTime() - lengthMs + 86400000)
  return { start: formatDate(compStart), end: formatDate(compEnd) }
}

export function formatRangeLabel(range: DateRange): string {
  return `${range.start.slice(5)} ~ ${range.end.slice(5)}`
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false)
  const activePreset = matchPreset(value)
  const comparison = getComparisonRange(value)

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => {
              onChange(getPresetRange(p.days))
              setShowCustom(false)
            }}
            className={cn(
              'px-3 py-1.5 text-xs rounded-md border transition-colors',
              activePreset === p.days && !showCustom
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:bg-accent'
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            'px-3 py-1.5 text-xs rounded-md border transition-colors',
            showCustom || activePreset === null
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:bg-accent'
          )}
        >
          自訂
        </button>
      </div>

      {showCustom && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="border border-border rounded px-2 py-1 bg-card text-foreground text-xs"
          />
          <span className="text-muted-foreground">~</span>
          <input
            type="date"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="border border-border rounded px-2 py-1 bg-card text-foreground text-xs"
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        比較：{formatRangeLabel(comparison)}
      </p>
    </div>
  )
}
