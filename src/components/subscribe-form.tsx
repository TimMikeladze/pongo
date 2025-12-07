"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { store } from "@/lib/store"

interface SubscribeFormProps {
  dashboardId: string
}

export function SubscribeForm({ dashboardId }: SubscribeFormProps) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email")
      return
    }

    setStatus("loading")
    setError("")

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500))

    store.addSubscriber(dashboardId, email)
    setStatus("success")
    setEmail("")

    setTimeout(() => setStatus("idle"), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError("")
          }}
          placeholder="Subscribe to updates"
          className="pl-9 h-8 text-xs font-mono bg-background/50"
          disabled={status === "loading" || status === "success"}
        />
      </div>
      <Button type="submit" size="sm" className="h-8 text-xs" disabled={status === "loading" || status === "success"}>
        {status === "loading" && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === "success" && <Check className="h-3 w-3" />}
        {status === "idle" && "Subscribe"}
        {status === "error" && "Retry"}
      </Button>
      {error && <p className="text-[10px] text-red-400 absolute -bottom-4">{error}</p>}
    </form>
  )
}
