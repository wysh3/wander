"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";
import { apiFetch } from "@/lib/api-client";
import { ShieldCheck, ChevronDown, ArrowRight, Phone } from "lucide-react";

export default function SignupPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const sendOTP = async () => {
    if (phone.length !== 10) return;
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
    if (otp.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch<any>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: `+91${phone}`, otp }),
      });
      setAuth(data.access_token, data.user);
      // Admin users skip verification/onboarding and go straight to admin panel
      if (data.user?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/verification");
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-start pt-20 px-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'linear-gradient(to bottom, rgba(234, 244, 244, 0.8), rgba(204, 227, 227, 0.4)), url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop")' }}
    >
      {/* Logo and Header */}
      <div className="flex flex-col items-center mb-10 z-10">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-[#28a8b5] mb-2 drop-shadow-sm">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm.3 9.7l-.3.3-.3-.3C10.2 10.3 9 9.2 9 7.8 9 6.6 9.9 5.7 11.1 5.7c.7 0 1.4.3 1.8.8.4-.5 1.1-.8 1.8-.8 1.2 0 2.1.9 2.1 2.1 0 1.4-1.2 2.5-2.7 3.9z" />
        </svg>
        <h1 className="text-[40px] font-bold text-[#1e3a5f] tracking-tight leading-none mb-2">wander</h1>
        <p className="text-[#28a8b5] font-semibold text-base mb-3">Go outside.</p>
        <div className="text-center text-[#1e3a5f]/80 text-sm font-medium">
          <p>Real people. Real connections.</p>
          <p>Step out. Feel alive.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm bg-white rounded-[32px] p-8 shadow-xl shadow-[#1e3a5f]/10 z-10 border border-white/50 backdrop-blur-sm relative">
        {step === "phone" ? (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">Let's get you started</h2>
            <p className="text-sm text-[#1e3a5f]/60 mb-6 text-center">Enter your mobile number to continue</p>
            
            <div className="w-full flex items-center border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 mb-6 focus-within:border-[#28a8b5] focus-within:ring-1 focus-within:ring-[#28a8b5] transition-all">
              <div className="flex items-center gap-1 border-r border-gray-200 pr-3 mr-3 text-[#1e3a5f] font-medium">
                <span>+91</span>
                <ChevronDown className="w-4 h-4 text-[#1e3a5f]/60" />
              </div>
              <input
                className="w-full bg-transparent border-none outline-none text-[#1e3a5f] placeholder:text-[#1e3a5f]/40 font-medium"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength={10}
                autoFocus
              />
            </div>
            
            {error && <p className="text-sm text-red-500 mb-4 w-full text-center">{error}</p>}
            
            <button 
              className="w-full bg-gradient-to-r from-[#2cb1bc] to-[#209ba5] hover:opacity-90 text-white rounded-xl py-4 font-semibold text-base flex justify-center items-center gap-2 transition-all shadow-md shadow-[#2cb1bc]/20 disabled:opacity-50"
              onClick={sendOTP}
              disabled={phone.length !== 10 || loading}
            >
              {loading ? "Sending..." : "Send OTP"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center justify-center gap-1.5 mt-6 text-[#1e3a5f]/60 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-[#28a8b5]" />
              <span>We'll never share your number</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-[#28a8b5]" />
            </div>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-2">Enter OTP</h2>
            <div className="text-sm text-[#1e3a5f]/60 mb-6 text-center">
              <p>We've sent a 6-digit OTP to</p>
              <p className="text-[#28a8b5] font-semibold mt-1">+91 {phone.slice(0, 5)} {phone.slice(5)}</p>
            </div>
            
            <div className="flex justify-between w-full gap-2 mb-6">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  className="w-10 h-12 border border-gray-200 rounded-lg text-center text-xl font-semibold text-[#1e3a5f] focus:border-[#28a8b5] focus:ring-1 focus:ring-[#28a8b5] outline-none transition-all bg-white shadow-sm"
                  value={otp[index] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    if (val) {
                      const newOtp = otp.split('');
                      newOtp[index] = val;
                      setOtp(newOtp.join(''));
                      if (index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace') {
                      if (!otp[index] && index > 0) {
                        document.getElementById(`otp-${index - 1}`)?.focus();
                      }
                      const newOtp = otp.split('');
                      newOtp[index] = '';
                      setOtp(newOtp.join(''));
                    }
                  }}
                />
              ))}
            </div>
            
            <p className="text-xs text-[#1e3a5f]/60 font-medium mb-6">
              Resend OTP in <span className="text-[#28a8b5] font-semibold">00:25</span>
            </p>
            
            {error && <p className="text-sm text-red-500 mb-4 w-full text-center">{error}</p>}
            
            <button 
              className="w-full bg-gradient-to-r from-[#2cb1bc] to-[#209ba5] hover:opacity-90 text-white rounded-xl py-4 font-semibold text-base flex justify-center items-center gap-2 transition-all shadow-md shadow-[#2cb1bc]/20 disabled:opacity-50 mb-6"
              onClick={verifyOTP}
              disabled={otp.length !== 6 || loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </button>
            
            <button 
              className="flex items-center justify-center gap-1.5 text-[#28a8b5] text-sm font-medium hover:underline"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
            >
              <Phone className="w-4 h-4" />
              <span>Change phone number?</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

