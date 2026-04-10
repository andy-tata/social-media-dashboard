import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ReportsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">報表產出</h2>
        <p className="text-sm text-muted-foreground mt-1">產出週報或月報，下載 Excel 檔案</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">報表功能開發中</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            接上 Supabase 資料庫並累積一定數據後，就可以產出報表。
          </p>
          <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm space-y-2">
            <p className="font-medium">功能預告：</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>週報 / 月報選擇</li>
              <li>自訂日期範圍</li>
              <li>勾選要包含的分析模塊</li>
              <li>匯出 Excel (.xlsx) 檔案</li>
              <li>包含圖表截圖和數據表格</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
