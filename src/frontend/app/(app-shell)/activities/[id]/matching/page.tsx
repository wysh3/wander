"use client";

import { useParams, useRouter } from "next/navigation";
import { useMatching } from "@/hooks/use-matching";
import { MatchingVisualization } from "@/components/matching/matching-visualization";
import { Play, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";

export default function MatchingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { phase, progress, result, error, start } = useMatching(id);

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[#2cb1bc] font-semibold text-sm hover:opacity-80 mb-2 md:hidden">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-[28px] font-bold text-[#1e3a5f]">AI Matching Engine</h1>
          <p className="text-[14px] text-[#1e3a5f]/60 mt-0.5">
            Powered by CP-SAT solver to create balanced, meaningful groups.
          </p>
        </div>
        
        <div className="hidden md:flex items-center gap-1.5 text-[#2cb1bc] bg-[#eaf4f4] px-3 py-1.5 rounded-full border border-[#2cb1bc]/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[11px] font-bold tracking-wide">Safe. Private. Phone-Free.</span>
        </div>
      </div>

      <MatchingVisualization phase={phase} progress={progress} result={result} />

      {error && <p className="text-sm font-medium text-red-500 bg-red-50 p-4 rounded-xl text-center border border-red-100">{error}</p>}

      {phase === "idle" && (
        <button 
          className="w-full max-w-sm mx-auto bg-[#2cb1bc] hover:bg-[#209ba5] text-white rounded-2xl py-4 font-bold text-[15px] flex justify-center items-center gap-3 transition-colors shadow-md shadow-[#2cb1bc]/20"
          onClick={start}
        >
          <Play className="w-5 h-5 fill-current" />
          Start Matching
        </button>
      )}
    </div>
  );
}

