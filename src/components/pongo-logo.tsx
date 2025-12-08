import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function PongoLogo({
  className,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/logo.png"
      alt="Pongo logo"
      className={cn("rounded-full", className)}
      {...props}
    />
  );
}
