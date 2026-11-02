"use client";

import Image from "next/image";
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="panel w-full max-w-sm space-y-6 p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {process.env.NEXT_PUBLIC_FOOTER_LOGO ? (
              <Image
                src={process.env.NEXT_PUBLIC_FOOTER_LOGO}
                alt={
                  process.env.NEXT_PUBLIC_FOOTER_TITLE ??
                  process.env.NEXT_PUBLIC_SITE_NAME ??
                  "pongo"
                }
                width={24}
                height={24}
                unoptimized
                className="rounded-full"
              />
            ) : (
              <PongoLogo size={24} />
            )}
            <span className="text-lg font-semibold tracking-tight">
              {process.env.NEXT_PUBLIC_FOOTER_TITLE ??
                process.env.NEXT_PUBLIC_SITE_NAME ??
                "pongo"}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your access code to open the monitoring workspace.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="access-code" className="text-sm font-medium">
            Access code
          </label>
          <Input
            id="access-code"
            name="access-code"
            autoComplete="current-password"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError("");
            }}
            disabled={isPending}
            placeholder="Enter access code"
            className="h-10"
          />

          {error && (
            <p
              id="login-error"
              role="alert"
              className="text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isPending || !code.trim()}
            className="h-10 w-full"
            size="sm"
            aria-busy={isPending}
          >
            {isPending ? "Verifying…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
