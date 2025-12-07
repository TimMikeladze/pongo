"use client";

import { Heart, Github, Coffee } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SupportDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="hover:text-foreground transition-colors flex items-center gap-1">
          <Heart className="h-3 w-3" />
          Support
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Heart className="h-4 w-4 text-red-500" />
            Support Pongo
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pongo is free and open-source. If you find it useful, consider
            supporting the project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-4">
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-9"
            asChild
          >
            <a
              href="https://github.com/timcole/pongo"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-4 w-4" />
              Star on GitHub
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-9"
            asChild
          >
            <a
              href="https://github.com/sponsors/timcole"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Heart className="mr-2 h-4 w-4 text-red-500" />
              Sponsor on GitHub
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-xs h-9"
            asChild
          >
            <a
              href="https://buymeacoffee.com/timcole"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Coffee className="mr-2 h-4 w-4" />
              Buy me a coffee
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
