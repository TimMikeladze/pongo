"use client"

import { useState } from "react"
import { Plus, Trash2, Mail, Phone, Webhook, MessageSquare, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useNotificationChannels } from "@/lib/hooks"
import { store } from "@/lib/store"
import type { NotificationChannel } from "@/lib/types"

const channelTypes = [
  { value: "email", label: "email", icon: Mail },
  { value: "sms", label: "sms", icon: Phone },
  { value: "webhook", label: "webhook", icon: Webhook },
  { value: "slack", label: "slack", icon: MessageSquare },
]

function ChannelIcon({ type }: { type: string }) {
  const config = channelTypes.find((c) => c.value === type)
  const Icon = config?.icon ?? Mail
  return <Icon className="h-3.5 w-3.5" />
}

export default function NotificationsPage() {
  const channels = useNotificationChannels()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newChannel, setNewChannel] = useState({
    type: "email" as NotificationChannel["type"],
    name: "",
    config: {} as Record<string, string>,
  })

  const handleCreate = () => {
    if (!newChannel.name.trim()) return

    store.createNotificationChannel({
      type: newChannel.type,
      name: newChannel.name,
      config: newChannel.config,
      isActive: true,
    })

    setNewChannel({ type: "email", name: "", config: {} })
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    if (confirm("delete this channel?")) {
      store.deleteNotificationChannel(id)
    }
  }

  const handleToggle = (id: string, isActive: boolean) => {
    store.updateNotificationChannel(id, { isActive })
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <Bell className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">alerts</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">notification channels</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 text-xs">
              <Plus className="mr-1.5 h-3 w-3" />
              add channel
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-sm">add notification channel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs">type</Label>
                <Select
                  value={newChannel.type}
                  onValueChange={(v) =>
                    setNewChannel({ ...newChannel, type: v as NotificationChannel["type"], config: {} })
                  }
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {channelTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-xs">
                        <div className="flex items-center gap-2">
                          <type.icon className="h-3.5 w-3.5" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">name</Label>
                <Input
                  value={newChannel.name}
                  onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })}
                  placeholder="team-alerts"
                  className="h-8 text-xs bg-background"
                />
              </div>

              {newChannel.type === "email" && (
                <div className="space-y-2">
                  <Label className="text-xs">email</Label>
                  <Input
                    type="email"
                    value={newChannel.config.email ?? ""}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, email: e.target.value },
                      })
                    }
                    placeholder="alerts@example.com"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              )}

              {newChannel.type === "sms" && (
                <div className="space-y-2">
                  <Label className="text-xs">phone</Label>
                  <Input
                    type="tel"
                    value={newChannel.config.phone ?? ""}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, phone: e.target.value },
                      })
                    }
                    placeholder="+1234567890"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              )}

              {newChannel.type === "webhook" && (
                <div className="space-y-2">
                  <Label className="text-xs">url</Label>
                  <Input
                    type="url"
                    value={newChannel.config.url ?? ""}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, url: e.target.value },
                      })
                    }
                    placeholder="https://example.com/webhook"
                    className="h-8 text-xs bg-background"
                  />
                </div>
              )}

              {newChannel.type === "slack" && (
                <div className="space-y-2">
                  <Label className="text-xs">webhook url</Label>
                  <Input
                    type="url"
                    value={newChannel.config.webhookUrl ?? ""}
                    onChange={(e) =>
                      setNewChannel({
                        ...newChannel,
                        config: { ...newChannel.config, webhookUrl: e.target.value },
                      })
                    }
                    placeholder="https://hooks.slack.com/services/..."
                    className="h-8 text-xs bg-background"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)} className="h-7 text-xs">
                  cancel
                </Button>
                <Button size="sm" onClick={handleCreate} className="h-7 text-xs">
                  add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info */}
      <div className="border border-dashed border-border rounded bg-card p-4 mb-6">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          notification channels define how you receive alerts when monitors detect issues. configure email, sms,
          webhooks, or slack integrations.
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          <span className="text-primary">note:</span> delivery not yet implemented. ui only.
        </p>
      </div>

      {/* Channels List */}
      <div className="space-y-3">
        {channels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
            <Bell className="h-6 w-6 text-muted-foreground mb-3" />
            <p className="text-xs text-muted-foreground mb-4">no channels configured</p>
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="h-7 text-xs">
              <Plus className="mr-1.5 h-3 w-3" />
              add channel
            </Button>
          </div>
        ) : (
          channels.map((channel) => (
            <div key={channel.id} className="border border-border rounded bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded bg-secondary">
                    <ChannelIcon type={channel.type} />
                  </div>
                  <div>
                    <p className="text-xs">{channel.name}</p>
                    <p className="text-[10px] text-muted-foreground">{channel.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={channel.isActive} onCheckedChange={(checked) => handleToggle(channel.id, checked)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(channel.id)}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                {channel.type === "email" && channel.config.email}
                {channel.type === "sms" && channel.config.phone}
                {channel.type === "webhook" && channel.config.url}
                {channel.type === "slack" && "slack integration"}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
