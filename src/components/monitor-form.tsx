"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { store } from "@/lib/store"
import type { Monitor, HttpMethod } from "@/lib/types"
import { Check, Loader2 } from "lucide-react"

interface MonitorFormProps {
  monitor?: Monitor
}

const httpMethods: HttpMethod[] = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"]

const intervalOptions = [
  { value: "30", label: "30s" },
  { value: "60", label: "1m" },
  { value: "300", label: "5m" },
  { value: "600", label: "10m" },
  { value: "1800", label: "30m" },
  { value: "3600", label: "1h" },
]

export function MonitorForm({ monitor }: MonitorFormProps) {
  const router = useRouter()
  const isEditing = !!monitor

  const [formData, setFormData] = useState({
    name: monitor?.name ?? "",
    url: monitor?.url ?? "",
    method: monitor?.method ?? ("GET" as HttpMethod),
    headers: monitor?.headers ? JSON.stringify(monitor.headers, null, 2) : "",
    body: monitor?.body ?? "",
    intervalSeconds: monitor?.intervalSeconds ?? 60,
    timeoutMs: monitor?.timeoutMs ?? 30000,
    expectedStatus: monitor?.expectedStatus ?? 200,
    isActive: monitor?.isActive ?? true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "required"
    if (!formData.url.trim()) newErrors.url = "required"
    try {
      new URL(formData.url)
    } catch {
      newErrors.url = "invalid url"
    }
    if (formData.headers) {
      try {
        JSON.parse(formData.headers)
      } catch {
        newErrors.headers = "invalid json"
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)

    const data = {
      name: formData.name.trim(),
      url: formData.url.trim(),
      method: formData.method,
      headers: formData.headers ? JSON.parse(formData.headers) : undefined,
      body: formData.body || undefined,
      intervalSeconds: formData.intervalSeconds,
      timeoutMs: formData.timeoutMs,
      expectedStatus: formData.expectedStatus,
      isActive: formData.isActive,
    }

    // Simulate a small delay for better UX feedback
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (isEditing) {
      store.updateMonitor(monitor.id, data)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      setIsSubmitting(false)
    } else {
      store.createMonitor(data)
      router.push("/monitors")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Settings */}
      <div className="border border-border rounded bg-card p-4 space-y-4">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">basic settings</h3>

        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs">
            name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="production-api"
            className="h-8 text-xs bg-background font-mono"
          />
          {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-[100px_1fr] gap-3">
          <div className="space-y-2">
            <Label htmlFor="method" className="text-xs">
              method
            </Label>
            <Select
              value={formData.method}
              onValueChange={(v) => setFormData({ ...formData, method: v as HttpMethod })}
            >
              <SelectTrigger className="h-8 text-xs bg-background font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {httpMethods.map((method) => (
                  <SelectItem key={method} value={method} className="text-xs font-mono">
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="text-xs">
              url
            </Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api.example.com/health"
              className="h-8 text-xs bg-background font-mono"
            />
            {errors.url && <p className="text-[10px] text-destructive">{errors.url}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive" className="text-xs text-muted-foreground">
            start monitoring immediately
          </Label>
        </div>
      </div>

      {/* Request Settings */}
      <div className="border border-border rounded bg-card p-4 space-y-4">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">request</h3>

        <div className="space-y-2">
          <Label htmlFor="headers" className="text-xs">
            headers <span className="text-muted-foreground">(json)</span>
          </Label>
          <Textarea
            id="headers"
            value={formData.headers}
            onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
            placeholder='{"Authorization": "Bearer token"}'
            className="text-xs bg-background min-h-[80px] resize-none font-mono"
          />
          {errors.headers && <p className="text-[10px] text-destructive">{errors.headers}</p>}
        </div>

        {["POST", "PUT", "PATCH"].includes(formData.method) && (
          <div className="space-y-2">
            <Label htmlFor="body" className="text-xs">
              body
            </Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder='{"key": "value"}'
              className="text-xs bg-background min-h-[80px] resize-none font-mono"
            />
          </div>
        )}
      </div>

      {/* Check Settings */}
      <div className="border border-border rounded bg-card p-4 space-y-4">
        <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">check settings</h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="interval" className="text-xs">
              interval
            </Label>
            <Select
              value={formData.intervalSeconds.toString()}
              onValueChange={(v) => setFormData({ ...formData, intervalSeconds: Number.parseInt(v) })}
            >
              <SelectTrigger className="h-8 text-xs bg-background font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {intervalOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs font-mono">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeout" className="text-xs">
              timeout <span className="text-muted-foreground">(ms)</span>
            </Label>
            <Input
              id="timeout"
              type="number"
              value={formData.timeoutMs}
              onChange={(e) => setFormData({ ...formData, timeoutMs: Number.parseInt(e.target.value) || 30000 })}
              min={1000}
              max={120000}
              className="h-8 text-xs bg-background font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedStatus" className="text-xs">
              expected status
            </Label>
            <Input
              id="expectedStatus"
              type="number"
              value={formData.expectedStatus}
              onChange={(e) => setFormData({ ...formData, expectedStatus: Number.parseInt(e.target.value) || 200 })}
              min={100}
              max={599}
              className="h-8 text-xs bg-background font-mono"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="h-8 text-xs"
          disabled={isSubmitting}
        >
          cancel
        </Button>
        <Button type="submit" size="sm" className="h-8 text-xs min-w-[100px]" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : showSuccess ? (
            <>
              <Check className="mr-1.5 h-3 w-3" />
              saved
            </>
          ) : isEditing ? (
            "save changes"
          ) : (
            "create monitor"
          )}
        </Button>
      </div>
    </form>
  )
}
