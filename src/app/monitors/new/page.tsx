"use client"

import { MonitorForm } from "@/components/monitor-form"
import { Terminal } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewMonitorPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8 pt-4">
        <Button variant="ghost" size="icon" asChild className="h-7 w-7">
          <Link href="/monitors">
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <Terminal className="h-4 w-4 text-primary" />
        <div>
          <h1 className="text-sm">new monitor</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">configure http endpoint monitoring</p>
        </div>
      </div>

      <MonitorForm />
    </div>
  )
}
