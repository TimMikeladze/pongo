"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PongoLogo } from "@/components/pongo-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!code.trim()) {
      setError("Please enter the access code");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await login(code);
      if (result.success) {
        router.push("/");
        router.refresh();
      } else {
        setError(result.error || "Invalid access code");
        setCode("");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {process.env.NEXT_PUBLIC_FOOTER_LOGO ? (
              <img
                src={process.env.NEXT_PUBLIC_FOOTER_LOGO}
                alt={
                  process.env.NEXT_PUBLIC_FOOTER_TITLE ??
                  process.env.NEXT_PUBLIC_SITE_NAME ??
                  "pongo"
                }
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <PongoLogo size={24} />
            )}
            <span className="text-lg tracking-wider font-medium">
              {process.env.NEXT_PUBLIC_FOOTER_TITLE ??
                process.env.NEXT_PUBLIC_SITE_NAME ??
                "pongo"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            enter access code to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4"
        >
          <Input
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            disabled={isPending}
            placeholder="access code"
            className="text-center"
            autoFocus
          />

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isPending || !code.trim()}
            className="w-full"
            size="sm"
          >
            {isPending ? "verifying..." : "enter"}
          </Button>
        </form>
      </div>
    </div>
  );
}
