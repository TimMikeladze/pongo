import { cn } from "@/lib/utils";

interface PongoLogoProps {
  className?: string;
  size?: number;
}

export function PongoLogo({ className, size = 24 }: PongoLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="pongo.sh logo"
      width={size}
      height={size}
      className={cn("rounded-full", className)}
    />
  );
}
