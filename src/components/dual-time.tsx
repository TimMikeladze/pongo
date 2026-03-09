"use client";

import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

interface DualTimeProps {
  date: Date | number | string;
  formatStr?: string;
  className?: string;
}

export function DualTime({
  date,
  formatStr = "MMM d, h:mm a",
  className,
}: DualTimeProps) {
  const d = date instanceof Date ? date : new Date(Number(date));
  const utc = formatInTimeZone(d, "UTC", formatStr);
  const local = format(d, formatStr);

  return (
    <span className={className}>
      <span className="text-muted-foreground">UTC</span> {utc}
      <br />
      <span className="text-muted-foreground">Local</span> {local}
    </span>
  );
}
