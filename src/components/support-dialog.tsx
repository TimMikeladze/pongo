"use client";

import {
  ChevronDown,
  ChevronUp,
  Coffee,
  Copy,
  Github,
  Heart,
  Info,
  Linkedin,
  Share2,
  Star,
  Twitter,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      role="img"
      aria-label="Bluesky"
    >
      <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z" />
    </svg>
  );
}

const shareText = "Check out pongo - open source uptime monitoring";
const shareUrl = "https://pongo.sh";

const sharePlatforms = [
  {
    id: "twitter",
    name: "Twitter",
    icon: Twitter,
    getUrl: () =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
  },
  {
    id: "bluesky",
    name: "Bluesky",
    icon: BlueskyIcon,
    getUrl: () =>
      `https://bsky.app/intent/compose?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    getUrl: () =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  },
];

interface SupportDialogProps {
  triggerClassName?: string;
  showLabel?: boolean;
  mode?: "support" | "about";
}

export function SupportDialog({
  triggerClassName,
  showLabel = true,
  mode = "support",
}: SupportDialogProps) {
  const isAbout = mode === "about";
  const Icon = isAbout ? Info : Heart;
  const label = isAbout ? "About" : "Support";
  const [shareExpanded, setShareExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ??
            "hover:text-foreground transition-colors flex items-center gap-1"
          }
          title={`${label} pongo`}
        >
          <Icon className="h-4 w-4" />
          {showLabel && <span>{label}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono">
            {isAbout ? "about" : "support"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          {isAbout ? (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">
                pongo is an open source uptime monitoring solution designed for
                developers who prefer configuration as code. define your
                monitors as simple typescript files, commit them to your
                repository, and deploy anywhere that runs node.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                track response times, uptime percentages, error rates, and
                latency percentiles with real-time dashboards. create beautiful
                public status pages to keep your users informed about service
                health.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                no database required — pongo reads monitor definitions directly
                from your filesystem. results are stored locally in sqlite,
                making it lightweight, portable, and easy to backup.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              pongo is free and open source. here are some ways
              you can support it:
            </p>
          )}
          {!isAbout && (
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
              <div className="rounded border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShareExpanded(!shareExpanded)}
                  className="flex items-center gap-3 p-3 w-full hover:bg-accent transition-colors group text-left"
                >
                  <Share2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">share us</div>
                    <div className="text-[10px] text-muted-foreground">
                      spread the word on social media
                    </div>
                  </div>
                  {shareExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-200",
                    shareExpanded ? "max-h-40" : "max-h-0",
                  )}
                >
                  <div className="relative border-t border-border">
                    <textarea
                      readOnly
                      value={`${shareText} ${shareUrl}`}
                      className="w-full text-xs bg-muted/50 p-3 pr-10 resize-none text-muted-foreground outline-none border-none"
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {copied && (
                      <span className="absolute bottom-3 right-3 text-[10px] text-green-500">
                        copied!
                      </span>
                    )}
                  </div>
                  <div className="flex items-center border-t border-border">
                    {sharePlatforms.map((platform, index) => (
                      <a
                        key={platform.id}
                        href={platform.getUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",
                          index < sharePlatforms.length - 1 &&
                          "border-r border-border",
                        )}
                        title={`Share on ${platform.name}`}
                      >
                        <platform.icon className="h-3.5 w-3.5" />
                        <span className="text-[10px]">{platform.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded border border-border overflow-hidden">
                <div className="flex items-center gap-3 p-3">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-xs font-medium">
                      follow the developer
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      stay updated on new features
                    </div>
                  </div>
                </div>
                <div className="flex items-center border-t border-border">
                  <a
                    href="https://twitter.com/linesofcode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground border-r border-border"
                    title="Twitter"
                  >
                    <Twitter className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Twitter</span>
                  </a>
                  <a
                    href="https://bsky.app/profile/linesofcode.bsky.social"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-accent transition-colors text-muted-foreground hover:text-[#0085ff] border-r border-border"
                    title="Bluesky"
                  >
                    <BlueskyIcon className="h-3.5 w-3.5" />
                    <span className="text-[10px]">Bluesky</span>
                  </a>
                  <a
                    href="https://linkedin.com/in/tim-mikeladze"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-accent transition-colors text-muted-foreground hover:text-[#0a66c2] border-r border-border"
                    title="LinkedIn"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    <span className="text-[10px]">LinkedIn</span>
                  </a>
                  <a
                    href="https://github.com/timmikeladze"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 p-2 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    title="GitHub"
                  >
                    <Github className="h-3.5 w-3.5" />
                    <span className="text-[10px]">GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
