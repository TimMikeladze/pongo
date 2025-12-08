"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilter = searchParams.get(filterParamName) || "all";
  const currentSearch = searchParams.get(searchParamName) || "";
  const [searchValue, setSearchValue] = useState(currentSearch);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "" || value === "all") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      }
      return newParams.toString();
    },
    [searchParams],
  );

  const handleFilterChange = (value: string) => {
    startTransition(() => {
      const query = createQueryString({ [filterParamName]: value });
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    startTransition(() => {
      const query = createQueryString({ [searchParamName]: value });
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    });
  };

  const clearSearch = () => {
    setSearchValue("");
    startTransition(() => {
      const query = createQueryString({ [searchParamName]: null });
      router.push(`${pathname}${query ? `?${query}` : ""}`);
    });
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full sm:w-auto">
      {/* Filter buttons */}
      {filterOptions.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filterOptions.map((option) => (
            <button
              type="button"
              key={option.value}
              onClick={() => handleFilterChange(option.value)}
              className={cn(
                "px-2 py-1 text-[10px] rounded transition-colors",
                currentFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
              )}
            >
              {option.label}
              {option.count !== undefined && (
                <span className="ml-1 opacity-60">({option.count})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Search input */}
      {showSearch && (
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "h-7 w-full sm:w-auto pl-7 pr-7 text-[10px] rounded border border-border bg-background",
              "focus:outline-none focus:ring-1 focus:ring-ring",
              "placeholder:text-muted-foreground/60",
              isPending && "opacity-50",
            )}
          />
          {searchValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
