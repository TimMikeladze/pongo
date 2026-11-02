"use client";

import { Search, X } from "lucide-react";
import { parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface ListFilterProps {
  filterOptions?: FilterOption[];
  filterParamName?: string;
  searchParamName?: string;
  placeholder?: string;
  showSearch?: boolean;
}

export function ListFilter({
  filterOptions = [],
  filterParamName = "filter",
  searchParamName = "q",
  placeholder = "Search...",
  showSearch = true,
}: ListFilterProps) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useQueryStates(
    {
      [searchParamName]: parseAsString.withDefault(""),
      [filterParamName]: parseAsString.withDefault("all"),
    },
    { shallow: false, history: "push", startTransition },
  );
  const search = query[searchParamName];
  const filter = query[filterParamName];

  return (
    <div className="monitor-toolbar" aria-busy={isPending}>
      {showSearch && (
        <div className="list-search flex items-center gap-1">
          <label className="monitor-search min-w-0">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setQuery({ [searchParamName]: event.target.value })
              }
              placeholder={placeholder}
              aria-label={placeholder.replace(/\.+$/, "")}
            />
          </label>
          {search && (
            <button
              type="button"
              className="control-button"
              aria-label="Clear search"
              onClick={() => setQuery({ [searchParamName]: "" })}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}
      {filterOptions.length > 0 && (
        <fieldset className="filter-group" aria-label="Filter dashboards">
          {filterOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => setQuery({ [filterParamName]: option.value })}
              aria-pressed={filter === option.value}
            >
              {option.label}
              {option.count !== undefined && (
                <span className="ml-1 text-muted-foreground">
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </fieldset>
      )}
    </div>
  );
}
