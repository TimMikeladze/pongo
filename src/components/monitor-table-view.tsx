"use client";

import { ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/page-layout";
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

export function MonitorTableView({
  rows,
  showFilters = true,
}: {
  rows: MonitorRow[];
  showFilters?: boolean;
}) {
  const [{ q: search, filter }, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      filter: parseAsString.withDefault("all"),
    },
    { shallow: true, history: "push" },
  );
  const [sort, setSort] = useState("status");
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
          <label className="monitor-search">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setFilters({ q: event.target.value })}
              placeholder="Search monitors…"
              aria-label="Search monitors"
            />
          </label>
          <fieldset className="filter-group" aria-label="Filter monitors">
            {filters.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => setFilters({ filter: option.value })}
                aria-pressed={filter === option.value}
              >
                {option.label}{" "}
                <span className="ml-1 text-muted-foreground">
                  {option.count}
                </span>
              </button>
            ))}
          </fieldset>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort monitors"
          >
            <option value="status">Status first</option>
            <option value="name">Name A–Z</option>
            <option value="latency">Slowest first</option>
          </select>
        </div>
      )}
      <div className="panel table-scroll">
        <table className="data-table monitor-table">
          <caption className="sr-only">
            Monitors and their current health and selected-period measurements
          </caption>
          <thead>
            <tr>
              <th scope="col">Monitor</th>
              <th scope="col">Status</th>
              <th scope="col" className="number">
                Availability
              </th>
              <th scope="col" className="number">
                Avg. response
              </th>
              <th scope="col" className="number">
                Interval
              </th>
              <th scope="col" className="number">
                Last check
              </th>
              <th scope="col">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.length ? (
              visible.map((row) => (
                <tr
                  key={row.id}
                  className={
                    row.active &&
                    (row.status === "down" || row.status === "degraded")
                      ? "monitor-attention"
                      : undefined
                  }
                >
                  <td>
                    <Link
                      href={`/monitors/${row.id}`}
                      className="font-medium hover:underline break-words"
                    >
                      {row.name}
                    </Link>
                    <div className="monitor-subtitle">{row.id}.ts</div>
                  </td>
                  <td>
                    <span className="status-pill" data-status={row.status}>
                      <span className="status-dot" />
                      {row.active
                        ? row.status === "up"
                          ? "Operational"
                          : healthLabels[row.status]
                        : "Paused"}
                    </span>
                  </td>
                  <td className="number" data-label="Availability">
                    {row.uptime === null ? "—" : `${row.uptime.toFixed(3)}%`}
                  </td>
                  <td className="number" data-label="Avg. response">
                    {row.responseTime === null ? "—" : `${row.responseTime} ms`}
                  </td>
                  <td className="number" data-label="Interval">
                    {row.interval}
                  </td>
                  <td className="number" data-label="Last check">
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
                  </td>
                  <td className="monitor-arrow">
                    <Link
                      href={`/monitors/${row.id}`}
                      aria-label={`Inspect ${row.name}`}
                      className="control-button border-0"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    variant="plain"
                    title={
                      filter === "attention" && !search
                        ? "No monitors need attention"
                        : "No monitors match your filters"
                    }
                    description="Clear your filters to see all configured monitors."
                  >
                    <button
                      type="button"
                      className="control-button"
                      onClick={() => {
                        setFilters({ filter: null, q: null });
                      }}
                    >
                      <X className="size-3.5" />
                      Clear filters
                    </button>
                  </EmptyState>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div
        className="flex justify-between gap-4 mt-3 text-xs text-muted-foreground"
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
