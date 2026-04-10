import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CampaignsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">活動追蹤</h2>
          <p className="text-sm text-muted-foreground mt-1">追蹤特定活動或版本更新的社群反應</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">尚未建立活動</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            接上 Supabase 資料庫後，就可以在這裡建立活動追蹤。
            你可以設定活動名稱、日期範圍和關鍵字，系統會自動計算活動前中後的社群反應變化。
          </p>
          <div className="mt-4 p-4 rounded-lg bg-muted/50 text-sm space-y-2">
            <p className="font-medium">功能預告：</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>建立活動：設定名稱、日期區間、相關關鍵字</li>
              <li>自動匹配：系統根據日期和關鍵字匹配相關貼文</li>
              <li>前中後對比：活動前 vs 活動中 vs 活動後的互動數據</li>
              <li>互動提升率：量化活動帶來的互動成長</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
