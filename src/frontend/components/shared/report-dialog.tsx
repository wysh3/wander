"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useReport } from "@/hooks/use-report";
import { Flag, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: "user" | "activity" | "group";
}

const REASONS = [
  "Spam or misleading",
  "Harassment or abuse",
  "Inappropriate content",
  "Safety concern",
  "Other",
];

export function ReportDialog({ isOpen, onClose, targetId, targetType }: ReportDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  
  const { mutate: submitReport, isPending } = useReport();

  const handleSubmit = () => {
    if (!reason) return;
    
    const payload: any = { reason, details };
    if (targetType === "user") payload.reported_user_id = targetId;
    if (targetType === "activity") payload.reported_activity_id = targetId;
    if (targetType === "group") payload.reported_group_id = targetId;

    submitReport(payload, {
      onSuccess: () => {
        setReason("");
        setDetails("");
        onClose();
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-border"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                <Flag className="w-5 h-5 text-destructive" />
                Report {targetType}
              </h2>
              <button 
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                disabled={isPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                We take safety seriously. Please let us know why you are reporting this {targetType}. Your report will remain anonymous.
              </p>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Reason</label>
                <select 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  disabled={isPending}
                >
                  <option value="" disabled>Select a reason...</option>
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Additional Details (Optional)</label>
                <textarea 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any additional context to help us understand..."
                  className="w-full p-2 h-24 rounded-md border border-input bg-background text-foreground text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="p-4 bg-muted/50 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={isPending}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!reason || isPending}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}