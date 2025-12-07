"use client";

import {
  BellOff,
  BellRing,
  MoreHorizontal,
  Power,
  PowerOff,
} from "lucide-react";
import { useTransition } from "react";
import {
  disableAlertAction,
  enableAlertAction,
  silenceAlertAction,
  unsilenceAlertAction,
} from "@/app/alerts/actions";
import type { AlertOverride } from "@/db";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface AlertActionsProps {
  alertId: string;
  override?: AlertOverride | null;
}

const SILENCE_DURATIONS = [
  { label: "30 minutes", ms: 30 * 60 * 1000 },
  { label: "1 hour", ms: 60 * 60 * 1000 },
  { label: "4 hours", ms: 4 * 60 * 60 * 1000 },
  { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
] as const;

export function AlertActions({ alertId, override }: AlertActionsProps) {
  const [isPending, startTransition] = useTransition();

  const isSilenced =
    override?.silencedUntil && new Date(override.silencedUntil) > new Date();
  const isDisabled = override?.disabled;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={isPending}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {isSilenced ? (
          <DropdownMenuItem
            onClick={() => startTransition(() => unsilenceAlertAction(alertId))}
          >
            <BellRing className="h-3 w-3 mr-2" />
            Unsilence
          </DropdownMenuItem>
        ) : (
          SILENCE_DURATIONS.map(({ label, ms }) => (
            <DropdownMenuItem
              key={ms}
              onClick={() =>
                startTransition(() => silenceAlertAction(alertId, ms))
              }
            >
              <BellOff className="h-3 w-3 mr-2" />
              Silence for {label}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        {isDisabled ? (
          <DropdownMenuItem
            onClick={() => startTransition(() => enableAlertAction(alertId))}
          >
            <Power className="h-3 w-3 mr-2" />
            Enable
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => startTransition(() => disableAlertAction(alertId))}
          >
            <PowerOff className="h-3 w-3 mr-2" />
            Disable
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
