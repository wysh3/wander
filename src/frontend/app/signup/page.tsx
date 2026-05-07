"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api-client";
import { Phone } from "lucide-react";

export default function SignupPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const sendOTP = async () => {
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone: `+91${phone}` }),
      });
      setStep("otp");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<any>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: `+91${phone}`, otp }),
      });
      setAuth(data.access_token, data.user);
      router.push("/onboarding");
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-wander-teal/5 to-background">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Wander</CardTitle>
          <CardDescription>Go outside.</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">+91</span>
                <Input
                  className="border-0 p-0 h-auto focus-visible:ring-0"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={sendOTP} disabled={phone.length !== 10 || loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="text-center text-2xl tracking-widest"
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={verifyOTP} disabled={otp.length !== 6 || loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <button className="w-full text-sm text-muted-foreground hover:underline" onClick={() => setStep("phone")}>
                Change phone number
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
