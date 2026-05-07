"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bell, Moon, Smartphone, LogOut, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { useState } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useAuthStore();
  
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/signup");
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20 pt-2 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white rounded-full border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1e3a5f]" />
        </button>
        <h1 className="text-[22px] font-bold text-[#1e3a5f]">App Settings</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-[#1e3a5f] text-[15px]">Push Notifications</p>
              <p className="text-[12px] text-[#1e3a5f]/50">Alerts for messages & meetups</p>
            </div>
          </div>
          <button 
            onClick={() => setNotifications(!notifications)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${notifications ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="h-px w-full bg-gray-100" />

        <div className="flex items-center justify-between opacity-50 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Moon className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="font-semibold text-[#1e3a5f] text-[15px]">Dark Mode</p>
              <p className="text-[12px] text-[#1e3a5f]/50">Coming soon</p>
            </div>
          </div>
          <button className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-gray-200">
            <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
          </button>
        </div>

        <div className="h-px w-full bg-gray-100" />

        <div className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-semibold text-[#1e3a5f] text-[15px]">App Version</p>
              <p className="text-[12px] text-[#1e3a5f]/50">v1.0.0 (Hackathon Build)</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onClick={handleLogout}
        className="w-full bg-red-50 hover:bg-red-100 border border-red-100 rounded-[24px] p-4 flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut className="w-5 h-5 text-red-500" />
        <span className="font-bold text-red-600 text-[15px]">Log Out</span>
      </motion.button>
    </div>
  );
}
