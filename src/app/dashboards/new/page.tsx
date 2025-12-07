import { DashboardForm } from "@/components/dashboard-form"

export default function NewDashboardPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">New Dashboard</h1>
        <p className="text-muted-foreground mt-1">Create a status page with multiple monitors</p>
      </div>

      <DashboardForm />
    </div>
  )
}
