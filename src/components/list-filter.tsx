"use client";

import { parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";
import { SearchField } from "@/components/search-field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
        <SearchField
          className="list-search monitor-search min-w-0"
          value={search}
          onValueChange={(value) => setQuery({ [searchParamName]: value })}
          placeholder={placeholder}
          label={placeholder.replace(/[.…]+$/, "")}
        />
      )}
      {filterOptions.length > 0 && (
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => {
            if (value) setQuery({ [filterParamName]: value });
          }}
          className="filter-group"
          aria-label="Filter dashboards"
        >
          {filterOptions.map((option) => (
            <ToggleGroupItem value={option.value} key={option.value}>
              {option.label}
              {option.count !== undefined && (
                <span className="ml-1 text-muted-foreground">
                  {option.count}
                </span>
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </div>
  );
}
