"use client";

import {
  Heart,
  Github,
  Coffee,
  Star,
  Share2,
  Twitter,
  Linkedin,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  );
}

interface SupportDialogProps {
  triggerClassName?: string;
  showLabel?: boolean;
}

export function SupportDialog({
  triggerClassName,
  showLabel = true,
}: SupportDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={
            triggerClassName ??
            "hover:text-foreground transition-colors flex items-center gap-1"
          }
          title="Support pongo"
        >
          <Heart className="h-3 w-3" />
          {showLabel && <span>Support</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono">support pongo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <p className="text-xs text-muted-foreground">
            pongo is free and open source. here are some ways to support the
            project:
          </p>
          <div className="space-y-2">
            <a
              href="https://github.com/timmikeladze/pongo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors group"
            >
              <Star className="h-4 w-4 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
              <div>
                <div className="text-xs font-medium">star on github</div>
                <div className="text-[10px] text-muted-foreground">
                  help others discover pongo
                </div>
              </div>
            </a>
            <a
              href="https://github.com/timmikeladze/pongo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors group"
            >
              <Github className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div>
                <div className="text-xs font-medium">contribute</div>
                <div className="text-[10px] text-muted-foreground">
                  report bugs or submit pull requests
                </div>
              </div>
            </a>
            <a
              href="https://github.com/sponsors/timmikeladze"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors group"
            >
              <Coffee className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 transition-colors" />
              <div>
                <div className="text-xs font-medium">sponsor</div>
                <div className="text-[10px] text-muted-foreground">
                  support ongoing development
                </div>
              </div>
            </a>
            <a
              href="https://twitter.com/intent/tweet?text=Check%20out%20pongo%20-%20open%20source%20uptime%20monitoring&url=https://pongo.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded border border-border hover:bg-accent transition-colors group"
            >
              <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <div className="text-xs font-medium">share us</div>
                <div className="text-[10px] text-muted-foreground">
                  spread the word on social media
                </div>
              </div>
            </a>
            <div className="flex items-center justify-center gap-4 p-3 rounded border border-border">
              <a
                href="https://github.com/timmikeladze"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com/timmikeladze"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="https://bsky.app/profile/tim.cole"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#0085ff] transition-colors"
                title="Bluesky"
              >
                <BlueskyIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/in/timmikeladze"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-[#0a66c2] transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
