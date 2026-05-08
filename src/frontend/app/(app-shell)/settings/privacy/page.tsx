"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Lock, ChevronLeft, Save } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PrivacySettingsPage() {
  const router = useRouter();

  // Mock Frontend State
  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [showFullName, setShowFullName] = useState(true);
  const [showInterests, setShowInterests] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate a fake request
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    setToastMessage("Privacy settings updated");
    
    // Clear toast message after slightly
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const isPrivate = profileVisibility === "private";

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-12 pt-2">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Privacy Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control how your profile appears to others.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Public Card */}
        <Card 
          className={`cursor-pointer transition-all ${profileVisibility === "public" ? "border-[#2cb1bc] bg-[#eaf4f4]" : "hover:bg-gray-50 border-gray-200"}`}
          onClick={() => {
            setProfileVisibility("public");
            setShowFullName(true);
            setShowInterests(true);
            setShowLocation(true);
          }}
        >
          <CardHeader className="text-center p-4">
            <Globe className={`mx-auto h-8 w-8 mb-2 ${profileVisibility === "public" ? "text-[#2cb1bc]" : "text-gray-400"}`} />
            <CardTitle className="text-base">Public</CardTitle>
            <CardDescription className="text-xs mt-1 leading-tight">
              Everyone can see your name, interests & area.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Private Card */}
        <Card 
          className={`cursor-pointer transition-all ${profileVisibility === "private" ? "border-purple-500 bg-purple-50" : "hover:bg-gray-50 border-gray-200"}`}
          onClick={() => setProfileVisibility("private")}
        >
          <CardHeader className="text-center p-4">
            <Lock className={`mx-auto h-8 w-8 mb-2 ${profileVisibility === "private" ? "text-purple-500" : "text-gray-400"}`} />
            <CardTitle className="text-base">Private</CardTitle>
            <CardDescription className="text-xs mt-1 leading-tight">
              You control what others can see.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className={`transition-opacity ${!isPrivate ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <CardContent className="p-0">
          {/* Show full name toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="pr-4">
              <p className="font-semibold text-sm text-[#1e3a5f]">Show full name</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Others see: {showFullName ? "Priya Sharma" : "Priya S. instead of Priya Sharma"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showFullName}
              disabled={!isPrivate}
              onClick={() => setShowFullName(!showFullName)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showFullName ? 'bg-[#2cb1bc]' : 'bg-gray-200'} ${!isPrivate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showFullName ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="h-px w-full bg-gray-100" />
          
          {/* Show interests toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="pr-4">
              <p className="font-semibold text-sm text-[#1e3a5f]">Show interests</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Others see your interest tags on your profile
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showInterests}
              disabled={!isPrivate}
              onClick={() => setShowInterests(!showInterests)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showInterests ? 'bg-[#2cb1bc]' : 'bg-gray-200'} ${!isPrivate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showInterests ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <div className="h-px w-full bg-gray-100" />
          
          {/* Show location toggle */}
          <div className="flex items-center justify-between p-4">
            <div className="pr-4">
              <p className="font-semibold text-sm text-[#1e3a5f]">Show location area</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Others see your neighbourhood e.g. Koramangala
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showLocation}
              disabled={!isPrivate}
              onClick={() => setShowLocation(!showLocation)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showLocation ? 'bg-[#2cb1bc]' : 'bg-gray-200'} ${!isPrivate ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showLocation ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="pt-4 flex flex-col items-center">
        {toastMessage && (
          <div className="mb-4 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-2">
            {toastMessage}
          </div>
        )}
        <Button 
          className="w-full bg-[#1e3a5f] hover:bg-[#1e3a5f]/90 text-white rounded-full py-6 font-semibold"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Privacy Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}