"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { SubmissionsList } from "@/components/admin/submissions-list"
import { StatsPanel } from "@/components/admin/stats-panel"
import { ExportPanel } from "@/components/admin/export-panel"
import { LogoutButton } from "@/components/admin/logout-button"
import { DebugPanel } from "@/components/admin/debug-panel"
import { SqlInstructions } from "@/components/admin/sql-instructions"

export function AdminDashboard() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("submissions")

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-lg font-bold">Målerjakt Admin</h1>
          <div className="flex gap-2">
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="container py-6 flex-1">
        <Tabs defaultValue="submissions" onValueChange={setActiveTab} value={activeTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="submissions">{t("submissions")}</TabsTrigger>
              <TabsTrigger value="stats">{t("statistics")}</TabsTrigger>
              <TabsTrigger value="export">{t("export")}</TabsTrigger>
              <TabsTrigger value="database">Database Fix</TabsTrigger>
            </TabsList>

            {activeTab === "export" && <Button>{t("exportGeojson")}</Button>}
          </div>

          <TabsContent value="submissions">
            <SubmissionsList />
            <DebugPanel />
          </TabsContent>

          <TabsContent value="stats">
            <StatsPanel />
          </TabsContent>

          <TabsContent value="export">
            <ExportPanel />
          </TabsContent>

          <TabsContent value="database">
            <SqlInstructions />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
