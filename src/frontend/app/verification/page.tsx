"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { ShieldCheck, ChevronRight, Lock, Shield, CheckCircle2, Users, FileText, Fingerprint } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export default function VerificationPage() {
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { setUser, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-redirect if already verified
  useEffect(() => {
    if (mounted && user?.verification_status === "verified") {
      setVerified(true);
      setTimeout(() => router.push("/onboarding"), 800);
    }
  }, [mounted, user, router]);

  // Redirect to signup if not authenticated
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/signup");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted) return null;

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
      <div className="w-full max-w-sm bg-white rounded-[32px] p-8 pb-6 shadow-xl shadow-[#1e3a5f]/10 z-10 border border-white/50 backdrop-blur-sm relative mb-8">
        
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/95 rounded-[32px] z-20 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
            <div className="w-12 h-12 mb-6 relative">
              <div className="absolute inset-0 rounded-full border-[3px] border-[#2cb1bc]/20"></div>
              <div className="absolute inset-0 rounded-full border-[3px] border-[#2cb1bc] border-t-transparent animate-spin"></div>
              {[...Array(8)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-2 bg-[#2cb1bc] rounded-full top-0 left-1/2 -ml-1 origin-[50%_24px] animate-pulse"
                  style={{ transform: `rotate(${i * 45}deg)`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">Verifying your identity...</h2>
            <p className="text-sm text-[#1e3a5f]/60 text-center">Please wait while we securely verify your details.</p>
          </div>
        )}

        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            {/* Laurel wreaths left and right */}
            <div className="absolute top-1/2 left-[-1.5rem] -translate-y-1/2">
              <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 5C14 8 8 16 8 20C8 24 16 32 20 35M14 12C10 14 6 18 6 20C6 22 10 26 14 28M10 16C8 17 6 19 6 20C6 21 8 23 10 24" stroke="#cce3e3" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="absolute top-1/2 right-[-1.5rem] -translate-y-1/2 scale-x-[-1]">
              <svg width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 5C14 8 8 16 8 20C8 24 16 32 20 35M14 12C10 14 6 18 6 20C6 22 10 26 14 28M10 16C8 17 6 19 6 20C6 21 8 23 10 24" stroke="#cce3e3" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            
            {/* Big Shield */}
            <div className="w-16 h-16 bg-gradient-to-b from-[#2cb1bc] to-[#1d9ba5] text-white rounded-2xl flex items-center justify-center transform rotate-3 shadow-lg shadow-[#2cb1bc]/30 relative z-10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 -rotate-3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">Verify Your Identity</h2>
          <p className="text-sm text-[#1e3a5f]/60 mb-8 text-center leading-relaxed">
            To keep our community safe and trustworthy, please verify your identity.
          </p>
          
          {verified ? (
            <div className="text-center space-y-2 py-4">
              <CheckCircle2 className="w-12 h-12 text-[#2cb1bc] mx-auto mb-2" />
              <h3 className="font-bold text-[#1e3a5f] text-lg">Identity Verified!</h3>
              <p className="text-sm text-[#1e3a5f]/60">Setting up your profile...</p>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <button 
                className="w-full flex items-center justify-between border border-[#2cb1bc] rounded-xl p-4 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                onClick={verifyDigilocker}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-[#1e3a5f]">Verify with DigiLocker</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#1e3a5f]/40" />
              </button>
              
              <button 
                className="w-full flex items-center justify-between border border-transparent rounded-xl p-4 bg-[#eaf4f4] hover:bg-[#dff0f0] transition-colors shadow-sm"
                onClick={verifyAadhaar}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center text-orange-500">
                    <Fingerprint className="w-7 h-7" />
                  </div>
                  <span className="font-semibold text-[#2cb1bc]">Verify with Aadhaar OTP</span>
                </div>
                <ChevronRight className="w-5 h-5 text-[#2cb1bc]/60" />
              </button>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mt-8 text-[#1e3a5f]/50 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Your data is encrypted and secure</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Features */}
      <div className="flex justify-center items-center gap-6 text-[#1e3a5f]/80 text-[11px] font-semibold tracking-wide w-full px-2 z-10 pb-8 mt-auto">
        <div className="flex flex-col items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#1e3a5f]/60" />
          <span>Verified Community</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Lock className="w-4 h-4 text-[#1e3a5f]/60" />
          <span>Secure & Private</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Users className="w-4 h-4 text-[#1e3a5f]/60" />
          <span>Built on Trust</span>
        </div>
      </div>
    </div>
  );
}
