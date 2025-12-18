import Image from "next/image";
import { cn } from "@/lib/utils";

interface PongoLogoProps {
  className?: string;
  size?: number;
}

export function PongoLogo({ className, size = 24 }: PongoLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Pongo logo"
      width={size}
      height={size}
      className={cn("rounded-full", className)}
      priority
    />
  );
}
