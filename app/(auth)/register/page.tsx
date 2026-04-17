"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    startTransition(async () => {
      try {
        await api("/api/v1/auth/register", {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
        });
        router.push("/setup");
      } catch {
        toast.error("Registration failed. Username may already exist.");
      }
    });
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-2xl border-2 p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-neutral-700">
          Create an account
        </h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-y-4">
          <div className="flex flex-col gap-y-1">
            <label
              htmlFor="username"
              className="text-sm font-semibold text-neutral-600"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={cn(
                "rounded-xl border-2 px-4 py-2 text-sm outline-none",
                "focus:border-sky-400"
              )}
            />
          </div>

          <div className="flex flex-col gap-y-1">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-neutral-600"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(
                "rounded-xl border-2 px-4 py-2 text-sm outline-none",
                "focus:border-sky-400"
              )}
            />
          </div>

          <div className="flex flex-col gap-y-1">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-neutral-600"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                "rounded-xl border-2 px-4 py-2 text-sm outline-none",
                "focus:border-sky-400"
              )}
            />
          </div>

          <div className="flex flex-col gap-y-1">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-semibold text-neutral-600"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(
                "rounded-xl border-2 px-4 py-2 text-sm outline-none",
                "focus:border-sky-400"
              )}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            aria-disabled={pending}
            className={cn(
              "mt-2 rounded-xl border-b-4 border-green-600 bg-green-500 py-3 font-bold text-white",
              "transition hover:bg-green-400 active:border-b-0",
              pending && "pointer-events-none opacity-60"
            )}
          >
            {pending ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a
            href="/login"
            className="font-semibold text-sky-500 hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
