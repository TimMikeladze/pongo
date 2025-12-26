"use client";

import { ExternalLink, Rocket, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DeployButtons() {
  const vercelUrl =
    "https://vercel.com/new/clone?repository-url=https://github.com/TimMikeladze/pongo&env=DATABASE_URL,CRON_SECRET&project-name=pongo&repository-name=pongo";
  const flyUrl = "https://fly.io/launch?org=personal";

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-muted/20">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Deploy Pongo</h2>
          </div>
          <p className="text-center text-sm text-muted-foreground max-w-2xl">
            Get your status page up and running in minutes with one-click
            deployment to Vercel or Fly.io
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <a
                href={vercelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <Zap className="mr-2 h-4 w-4" />
                Deploy to Vercel
                <ExternalLink className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="group border-2 hover:bg-muted/50 transition-all duration-200"
            >
              <a
                href={flyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  role="img"
                  aria-label="Fly.io logo"
                >
                  <title>Fly.io</title>
                  <path d="M128 0C57.308 0 0 57.308 0 128s57.308 128 128 128 128-57.308 128-128S198.692 0 128 0zm0 234.667C68.267 234.667 21.333 187.733 21.333 128S68.267 21.333 128 21.333 234.667 68.267 234.667 128 187.733 234.667 128 234.667z" />
                  <path d="M128 64L64 128l64 64 64-64z" />
                </svg>
                Launch on Fly.io
                <ExternalLink className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 transition-opacity" />
              </a>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground pt-2">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>Vercel: TypeScript monitors</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Fly.io: Full Python + TypeScript support</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
