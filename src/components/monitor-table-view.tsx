"use client";

import { ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { useMemo } from "react";
import { EmptyState } from "@/components/page-layout";
import { SearchField } from "@/components/search-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { healthLabels } from "@/lib/health";
import type { MonitorStatus } from "@/lib/types";

interface MonitorRow {
  id: string;
  name: string;
  active: boolean;
  status: MonitorStatus;
  uptime: number | null;
  responseTime: number | null;
  interval: string;
  checkedAt: string | null;
}
const rank: Record<MonitorStatus, number> = {
  down: 0,
  degraded: 1,
  pending: 2,
  up: 3,
};
const sortValues = ["status", "name", "latency"] as const;
const filterValues = ["all", "attention", "active", "paused"] as const;

export function MonitorTableView({
  rows,
  showFilters = true,
}: {
  rows: MonitorRow[];
  showFilters?: boolean;
}) {
  const [{ q: search, filter, sort }, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      filter: parseAsStringLiteral(filterValues).withDefault("all"),
      sort: parseAsStringLiteral(sortValues).withDefault("status"),
    },
    { shallow: true, history: "push" },
  );
  const attentionCount = rows.filter(
    (row) => row.active && (row.status === "down" || row.status === "degraded"),
  ).length;
  const visible = useMemo(
    () =>
      rows
        .filter((row) => {
          if (
            filter === "attention" &&
            !(
              row.active &&
              (row.status === "down" || row.status === "degraded")
            )
          )
            return false;
          if (
            (filter === "active" && !row.active) ||
            (filter === "paused" && row.active)
          )
            return false;
          return `${row.name} ${row.id}`
            .toLowerCase()
            .includes(search.toLowerCase());
        })
        .sort((a, b) => {
          if (sort === "name") return a.name.localeCompare(b.name);
          if (sort === "latency")
            return (b.responseTime ?? -1) - (a.responseTime ?? -1);
          return (
            Number(!a.active) - Number(!b.active) ||
            rank[a.status] - rank[b.status] ||
            a.name.localeCompare(b.name)
          );
        }),
    [rows, search, filter, sort],
  );
  const filters = [
    { value: "all", label: "All", count: rows.length },
    { value: "attention", label: "Needs attention", count: attentionCount },
    ...(rows.some((row) => !row.active)
      ? [
          {
            value: "active",
            label: "Active",
            count: rows.filter((row) => row.active).length,
          },
          {
            value: "paused",
            label: "Paused",
            count: rows.filter((row) => !row.active).length,
          },
        ]
      : []),
  ];
  return (
    <div>
      {showFilters && (
        <div className="monitor-toolbar">
          <SearchField
            className="monitor-search"
            value={search}
            onValueChange={(value) => setFilters({ q: value })}
            placeholder="Search monitors…"
            label="Search monitors"
          />
          <ToggleGroup
            type="single"
            value={filter}
            onValueChange={(value) => {
              if (value)
                setFilters({ filter: value as (typeof filterValues)[number] });
            }}
            className="filter-group"
            aria-label="Filter monitors"
          >
            {filters.map((option) => (
              <ToggleGroupItem value={option.value} key={option.value}>
                {option.label}{" "}
                <span className="ml-1 text-muted-foreground">
                  {option.count}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select
            value={sort}
            onValueChange={(value) =>
              setFilters({ sort: value as (typeof sortValues)[number] })
            }
          >
            <SelectTrigger aria-label="Sort monitors" className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="status">Status first</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="latency">Slowest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="panel table-scroll">
        <Table className="data-table monitor-table">
          <TableCaption className="sr-only">
            Monitors and their current health and selected-period measurements
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Monitor</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" className="number">
                Availability
              </TableHead>
              <TableHead scope="col" className="number">
                Avg. response
              </TableHead>
              <TableHead scope="col" className="number">
                Interval
              </TableHead>
              <TableHead scope="col" className="number">
                Last check
              </TableHead>
              <TableHead scope="col">
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length ? (
              visible.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    row.active &&
                    (row.status === "down" || row.status === "degraded")
                      ? "monitor-attention"
                      : undefined
                  }
                >
                  <TableCell className="max-sm:whitespace-normal">
                    <Link
                      href={`/monitors/${row.id}`}
                      className="font-medium hover:underline break-words"
                    >
                      {row.name}
                    </Link>
                    <div className="monitor-subtitle">{row.id}.ts</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="status"
                      className="status-pill"
                      data-status={row.status}
                    >
                      <span className="status-dot" />
                      {row.active
                        ? row.status === "up"
                          ? "Operational"
                          : healthLabels[row.status]
                        : "Paused"}
                    </Badge>
                  </TableCell>
                  <TableCell className="number" data-label="Availability">
                    {row.uptime === null ? "—" : `${row.uptime.toFixed(3)}%`}
                  </TableCell>
                  <TableCell className="number" data-label="Avg. response">
                    {row.responseTime === null ? "—" : `${row.responseTime} ms`}
                  </TableCell>
                  <TableCell className="number" data-label="Interval">
                    {row.interval}
                  </TableCell>
                  <TableCell className="number" data-label="Last check">
                    {row.checkedAt ? (
                      <time
                        dateTime={row.checkedAt}
                        title={new Date(row.checkedAt).toUTCString()}
                      >
                        {new Date(row.checkedAt).toISOString().slice(11, 19)}{" "}
                        UTC
                      </time>
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                  <TableCell className="monitor-arrow">
                    <Button asChild variant="outline">
                      <Link
                        href={`/monitors/${row.id}`}
                        aria-label={`Inspect ${row.name}`}
                        className="control-button border-0"
                      >
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7}>
                  <EmptyState
                    variant="plain"
                    title={
                      filter === "attention" && !search
                        ? "No monitors need attention"
                        : "No monitors match your filters"
                    }
                    description="Clear your filters to see all configured monitors."
                  >
                    <Button
                      variant="outline"
                      type="button"
                      className="control-button"
                      onClick={() => {
                        setFilters({ filter: null, q: null });
                      }}
                    >
                      <X className="size-3.5" />
                      Clear filters
                    </Button>
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div
        className="flex justify-between gap-3 mt-3 text-xs text-muted-foreground"
        aria-live="polite"
      >
        <span>
          Showing {visible.length} of {rows.length} monitors
        </span>
        <span className="hidden sm:inline">
          Configuration in <code>pongo/monitors/</code>
        </span>
      </div>
    </div>
  );
}
