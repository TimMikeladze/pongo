"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { store } from "@/lib/store"
import type { Announcement } from "@/lib/types"

interface AnnouncementFormProps {
  dashboardId: string
  onSuccess?: () => void
}

export function AnnouncementForm({ dashboardId, onSuccess }: AnnouncementFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info" as Announcement["type"],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.message.trim()) return

    store.createAnnouncement({
      dashboardId,
      title: formData.title.trim(),
      message: formData.message.trim(),
      type: formData.type,
    })

    setFormData({ title: "", message: "", type: "info" })
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-[10px] uppercase tracking-wide">
          Title
        </Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Announcement title"
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-[10px] uppercase tracking-wide">
          Message
        </Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Announcement details..."
          className="font-mono text-xs min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type" className="text-[10px] uppercase tracking-wide">
          Type
        </Label>
        <Select
          value={formData.type}
          onValueChange={(v) => setFormData({ ...formData, type: v as Announcement["type"] })}
        >
          <SelectTrigger className="text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full text-xs">
        Post Announcement
      </Button>
    </form>
  )
}
