import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type MetricCardProps = {
  title: string
  value: string | number
  change?: number // 百分比變化
  subtitle?: string
  className?: string
}

export function MetricCard({ title, value, change, subtitle, className }: MetricCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {change !== undefined && (
            <span
              className={cn(
                'text-xs font-medium',
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}
            >
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-muted-foreground">{subtitle}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
