"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/status-badge"
import { store } from "@/lib/store"
import { useMonitors, useLatestCheckResult } from "@/lib/hooks"
import type { Dashboard } from "@/lib/types"

interface DashboardFormProps {
  dashboard?: Dashboard
}

function MonitorCheckboxItem({
  id,
  name,
  checked,
  onCheckedChange,
}: {
  id: string
  name: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const result = useLatestCheckResult(id)
  const status = result?.status ?? "pending"

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <StatusBadge status={status} size="sm" />
      <Label htmlFor={id} className="flex-1 cursor-pointer">
        {name}
      </Label>
    </div>
  )
}

export function DashboardForm({ dashboard }: DashboardFormProps) {
  const router = useRouter()
  const monitors = useMonitors()
  const isEditing = !!dashboard

  const [formData, setFormData] = useState({
    name: dashboard?.name ?? "",
    slug: dashboard?.slug ?? "",
    isPublic: dashboard?.isPublic ?? false,
    monitorIds: dashboard?.monitorIds ?? [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Name is required"
    if (!formData.slug.trim()) newErrors.slug = "Slug is required"
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens"
    }
    // Check for duplicate slug
    const existing = store.getDashboardBySlug(formData.slug)
    if (existing && (!isEditing || existing.id !== dashboard?.id)) {
      newErrors.slug = "This slug is already in use"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const data = {
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      isPublic: formData.isPublic,
      monitorIds: formData.monitorIds,
    }

    if (isEditing) {
      store.updateDashboard(dashboard.id, data)
    } else {
      store.createDashboard(data)
    }

    router.push("/dashboards")
  }

  const toggleMonitor = (id: string, checked: boolean) => {
    setFormData({
      ...formData,
      monitorIds: checked ? [...formData.monitorIds, id] : formData.monitorIds.filter((mid) => mid !== id),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                const name = e.target.value
                setFormData({
                  ...formData,
                  name,
                  slug: isEditing ? formData.slug : generateSlug(name),
                })
              }}
              placeholder="Production Status"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/public/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                placeholder="production-status"
                className="font-mono"
              />
            </div>
            {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
            />
            <Label htmlFor="isPublic">Public Dashboard</Label>
          </div>
          <p className="text-sm text-muted-foreground">Public dashboards can be accessed without authentication</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Monitors</CardTitle>
        </CardHeader>
        <CardContent>
          {monitors.length === 0 ? (
            <p className="text-muted-foreground">No monitors available. Create a monitor first.</p>
          ) : (
            <div className="grid gap-2">
              {monitors.map((monitor) => (
                <MonitorCheckboxItem
                  key={monitor.id}
                  id={monitor.id}
                  name={monitor.name}
                  checked={formData.monitorIds.includes(monitor.id)}
                  onCheckedChange={(checked) => toggleMonitor(monitor.id, !!checked)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit">{isEditing ? "Save Changes" : "Create Dashboard"}</Button>
      </div>
    </form>
  )
}
