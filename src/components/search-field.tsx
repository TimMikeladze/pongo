"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export function SearchField({
  value,
  onValueChange,
  label,
  placeholder,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder: string;
  className?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const clear = () => {
    onValueChange("");
    input.current?.focus();
  };

  return (
    <InputGroup className={cn("search-field bg-card", className)}>
      <InputGroupInput
        ref={input}
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape" && value) {
            event.preventDefault();
            event.stopPropagation();
            clear();
          }
        }}
        aria-label={label}
        placeholder={placeholder}
        className="[&::-webkit-search-cancel-button]:appearance-none"
      />
      <InputGroupAddon>
        <Search className="size-4" aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupAddon align="inline-end" className="py-0">
        <InputGroupButton
          size="icon-sm"
          aria-label="Clear search"
          aria-hidden={!value}
          disabled={!value}
          tabIndex={value ? 0 : -1}
          className={cn("text-muted-foreground", !value && "invisible")}
          onClick={clear}
        >
          <X className="size-4" aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
