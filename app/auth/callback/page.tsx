// app/auth/callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3001/auth/me", {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Not authenticated");

        const user = await res.json();
        console.log("🔐 Authenticated user:", user);

        setStatus("success");
        // Redirect anywhere you want
        router.push("/settings"); // or '/dashboard', etc.
      } catch (err) {
        console.error("❌ Auth check failed:", err);
        setStatus("error");
      }
    };

    if (searchParams.get("status") === "success") {
      checkAuth();
    } else {
      setStatus("error");
    }
  }, [searchParams, router]);

  if (status === "loading") return <p>Authenticating... Please wait</p>;
  if (status === "error")
    return <p>Authentication failed. Please try again.</p>;

  return null; // already redirecting
}
