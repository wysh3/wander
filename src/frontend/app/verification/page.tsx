"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { VerifiedBadge } from "@/components/shared/verified-badge";
import { apiFetch } from "@/lib/api-client";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function VerificationPage() {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const { setUser, user } = useAuthStore();

  const verifyDigilocker = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const data = await apiFetch<any>("/verify/digilocker/fetch");
      setUser({ ...user!, verification_status: "verified", name: data.name });
      setVerified(true);
      setTimeout(() => router.push("/onboarding"), 1500);
    } catch {}
    setLoading(false);
  };

  const verifyAadhaar = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const data = await apiFetch("/verify/aadhaar/confirm", { method: "POST", body: JSON.stringify({}) });
      setUser({ ...user!, verification_status: "verified" });
      setVerified(true);
      setTimeout(() => router.push("/onboarding"), 1500);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-wander-teal mb-2" />
          <CardTitle>Verify Your Identity</CardTitle>
          <CardDescription>
            Government-verified identity for safety. Choose a method:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verified ? (
            <div className="text-center space-y-2">
              <VerifiedBadge />
              <p className="text-sm">Verified! Setting up your profile...</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <Button className="w-full" variant="outline" onClick={verifyDigilocker}>
                Verify with DigiLocker
              </Button>
              <Button className="w-full" variant="secondary" onClick={verifyAadhaar}>
                Verify with Aadhaar OTP
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
