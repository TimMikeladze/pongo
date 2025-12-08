import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, CheckCircle, Info, Wrench } from "lucide-react";
import { getAnnouncements } from "@/lib/data";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  maintenance: Wrench,
};

const typeStyles = {
  info: "border-blue-500/30 bg-blue-500/5 text-blue-400",
  warning: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  success: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400",
  maintenance: "border-purple-500/30 bg-purple-500/5 text-purple-400",
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
      <div className="text-center py-8 text-[11px] text-muted-foreground border border-border rounded-lg">
        No announcements
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayAnnouncements.map((announcement) => {
        const Icon = typeIcons[announcement.type];
        return (
          <div
            key={announcement.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${typeStyles[announcement.type]}`}
          >
            <Icon className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium">{announcement.title}</p>
                <span className="text-[10px] opacity-60">
                  {formatDistanceToNow(new Date(announcement.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {/* biome-ignore lint/security/noDangerouslySetInnerHtml: rendering markdown */}
              <div
                className="text-[11px] opacity-80 mt-1 prose prose-sm prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: announcement.message }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
