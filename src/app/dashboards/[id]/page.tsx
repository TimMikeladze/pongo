"use client"

import { useParams, notFound, useRouter } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, ExternalLink, Trash2, Plus, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DashboardForm } from "@/components/dashboard-form"
import { DashboardView } from "@/components/dashboard-view"
import { AnnouncementForm } from "@/components/announcement-form"
import { AnnouncementsList } from "@/components/announcements-list"
import { IncidentsTimeline } from "@/components/incidents-timeline"
import { MaintenanceSchedule } from "@/components/maintenance-schedule"
import { useDashboard } from "@/lib/hooks"
import { store } from "@/lib/store"

export default function DashboardDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const dashboard = useDashboard(id)
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false)

  if (!dashboard) {
    notFound()
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this dashboard?")) {
      store.deleteDashboard(dashboard.id)
      router.push("/dashboards")
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
          <Link href="/dashboards">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-sm font-medium">{dashboard.name}</h1>
          <p className="text-muted-foreground text-[10px] font-mono">/public/{dashboard.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8 bg-transparent">
                <Megaphone className="mr-2 h-3 w-3" />
                Post Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-sm">Post Announcement</DialogTitle>
              </DialogHeader>
              <AnnouncementForm dashboardId={dashboard.id} onSuccess={() => setAnnouncementDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          {dashboard.isPublic && (
            <Button variant="outline" size="sm" asChild className="text-xs h-8 bg-transparent">
              <Link href={`/public/${dashboard.slug}`} target="_blank">
                <ExternalLink className="mr-2 h-3 w-3" />
                View Public
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-xs h-8 text-destructive hover:text-destructive bg-transparent"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="preview" className="space-y-6">
        <TabsList className="text-xs">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <DashboardView dashboard={dashboard} />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">All Announcements</h3>
            <Dialog open={announcementDialogOpen} onOpenChange={setAnnouncementDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7 bg-transparent">
                  <Plus className="mr-1 h-3 w-3" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-sm">Post Announcement</DialogTitle>
                </DialogHeader>
                <AnnouncementForm dashboardId={dashboard.id} onSuccess={() => setAnnouncementDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <AnnouncementsList dashboardId={dashboard.id} showDelete />
        </TabsContent>

        <TabsContent value="incidents" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">Incident History</h3>
          </div>
          <IncidentsTimeline dashboardId={dashboard.id} />

          <div className="space-y-3">
            <h3 className="text-[10px] uppercase tracking-wide text-muted-foreground">Scheduled Maintenance</h3>
            <MaintenanceSchedule dashboardId={dashboard.id} showDelete />
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="max-w-2xl">
            <DashboardForm dashboard={dashboard} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
