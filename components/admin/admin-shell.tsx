"use client";

import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import type { UserProfile } from "@/types/api";

export function AdminShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const profile = await api<UserProfile>("/api/v1/users/me");
        if (!profile.is_admin) {
          setStatus("denied");
          router.replace("/learn");
          return;
        }

        setStatus("allowed");
      } catch {
        setStatus("denied");
        router.replace("/login");
      }
    };

    verifyAdmin();
  }, [router]);

  if (status !== "allowed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
          Validating admin access...
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-neutral-100">{children}</div>;
}
