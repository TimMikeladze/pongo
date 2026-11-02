import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, Info, Wrench } from "lucide-react";
import { EmptyState } from "@/components/page-layout";
import { getAnnouncements } from "@/lib/data";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  maintenance: Wrench,
};

const typeStyles = {
  info: "text-muted-foreground",
  warning: "text-status-degraded",
  success: "text-status-up",
  maintenance: "text-muted-foreground",
};

interface AnnouncementsListProps {
  dashboardId?: string;
  limit?: number;
}

export async function AnnouncementsList({
  dashboardId,
  limit,
}: AnnouncementsListProps) {
  const announcements = await getAnnouncements(dashboardId);
  const displayAnnouncements = limit
    ? announcements.slice(0, limit)
    : announcements;

  if (displayAnnouncements.length === 0) {
    return (
      <EmptyState
        title="No updates posted"
        description="Service announcements will appear here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {displayAnnouncements.map((announcement) => {
        const Icon = typeIcons[announcement.type];
        return (
          <div
            key={announcement.id}
            className="panel flex items-start gap-3 p-4"
          >
            <Icon
              className={`h-4 w-4 mt-0.5 shrink-0 ${typeStyles[announcement.type]}`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{announcement.title}</p>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(announcement.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div
                className="text-sm text-muted-foreground mt-1 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: announcement.message }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
