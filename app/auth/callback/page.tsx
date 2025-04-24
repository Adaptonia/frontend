"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Not authenticated");

        const user = await res.json();
        console.log("🔐 Authenticated user:", user);

        setStatus("success");
        router.push("/settings");
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

  return null; // Already redirecting
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
