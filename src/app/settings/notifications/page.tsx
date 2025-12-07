import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <Bell className="h-4 w-4 text-primary" />
          <div>
            <h1 className="text-sm">alerts</h1>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              notification channels
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="border border-dashed border-border rounded bg-card p-4 mb-6">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          notification channels define how you receive alerts when monitors
          detect issues. configure email, sms, webhooks, or slack integrations.
        </p>
        <p className="text-[10px] text-muted-foreground mt-2">
          <span className="text-primary">note:</span> notification configuration
          not yet implemented. this feature will be added in a future update.
        </p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded">
        <Bell className="h-6 w-6 text-muted-foreground mb-3" />
        <p className="text-xs text-muted-foreground mb-1">
          no channels configured
        </p>
        <p className="text-[10px] text-muted-foreground">
          notification management coming soon
        </p>
      </div>
    </div>
  );
}
