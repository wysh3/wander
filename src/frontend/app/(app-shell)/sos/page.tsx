"use client";

import { useState } from "react";
import { useSOS } from "@/hooks/use-sos";
import { SOSButton } from "@/components/sos/sos-button";
import { ShieldAlert, Phone, MapPin, User, Shield, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SOSPage() {
  const { activeSOS, triggerSOS, cancelSOS, alerts } = useSOS();
  const [triggered, setTriggered] = useState(false);

  const handleActivate = async () => {
    try {
      await triggerSOS(13.3702, 77.6835);
      setTriggered(true);
      toast.success("SOS alert sent to emergency contact");
    } catch {
      toast.error("SOS trigger failed. Try again.");
    }
  };

  const handleCancel = async () => {
    await cancelSOS();
    setTriggered(false);
    toast.success("SOS cancelled");
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="text-[32px] font-bold text-[#1e3a5f]">Emergency SOS</h1>
        <p className="text-[15px] font-medium text-[#1e3a5f]/60 mt-1">
          Hold for 2 seconds to alert your emergency contact
        </p>
      </div>

      <div className="mb-12">
        <SOSButton onActivate={handleActivate} active={triggered} />
      </div>

      {triggered && (
        <div className="w-full space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-red-50 rounded-2xl border border-red-200 p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-red-700 text-lg">SOS Active</h3>
                <p className="text-xs font-semibold text-red-600/70 uppercase tracking-wide">Emergency Services Notified</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-xl p-3 border border-red-100 flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm font-semibold text-[#1e3a5f] truncate">Nandi Hills</span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-red-100 flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-sm font-semibold text-[#1e3a5f] truncate">Local Police</span>
              </div>
            </div>

            <button 
              onClick={handleCancel}
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-[#1e3a5f] font-bold py-3.5 rounded-xl transition-colors text-[15px]"
            >
              Cancel SOS (False Alarm)
            </button>
          </div>
        </div>
      )}

      {/* Emergency contact's alert view (simulated) */}
      {alerts.length > 0 && (
        <div className="w-full mt-10 pt-10 border-t border-gray-100 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-300">
          <h2 className="text-[13px] font-bold text-[#1e3a5f]/40 uppercase tracking-widest mb-4 text-center">
            Simulated Emergency Contact View
          </h2>
          
          <div className="bg-[#1e3a5f] rounded-2xl p-5 shadow-xl text-white">
            <div className="flex items-center gap-2 text-red-400 mb-4 pb-4 border-b border-white/10">
              <ShieldAlert className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wide">Emergency Alert</span>
            </div>
            
            {alerts.slice(-1).map((alert, i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{alert.user_name || "Alex"} triggered SOS</h3>
                    <p className="text-sm text-white/60">3 mins ago</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Last Known Location</p>
                      <p className="text-xs text-white/60 mt-1">Lat: {alert.lat.toFixed(4)}, Lng: {alert.lng.toFixed(4)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Nearest Police Station</p>
                      <p className="text-xs text-white/60 mt-1">{alert.nearest_police_station}</p>
                    </div>
                  </div>

                  {alert.host_name && (
                    <div className="flex items-start gap-3 pt-3 border-t border-white/10">
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {alert.host_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-amber-400">Host: {alert.host_name}</p>
                        <p className="text-xs text-white/60 mt-1">{alert.host_phone}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="flex-1 bg-white text-[#1e3a5f] font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors">
                    <Phone className="w-4 h-4" /> Call User
                  </button>
                  <button className="flex-1 bg-[#2cb1bc] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#209ba5] transition-colors">
                    <MapPin className="w-4 h-4" /> Navigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

