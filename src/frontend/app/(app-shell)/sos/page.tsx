"use client";

import { useState } from "react";
import { useSOS } from "@/hooks/use-sos";
import { SOSButton } from "@/components/sos/sos-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Siren, Phone, MapPin, User, Shield } from "lucide-react";
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
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Emergency SOS</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hold for 2 seconds to alert your emergency contact
        </p>
      </div>

      <div className="flex justify-center py-4">
        <SOSButton onActivate={handleActivate} active={triggered} />
      </div>

      {triggered && (
        <div className="text-center space-y-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <Siren className="h-5 w-5" />
                <span className="font-semibold">SOS Active</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" /> Nandi Hills
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Shield className="h-3 w-3" /> Police notified
                </div>
              </div>
            </CardContent>
          </Card>
          <Button variant="outline" onClick={handleCancel}>
            Cancel SOS (False Alarm)
          </Button>
        </div>
      )}

      {/* Emergency contact's alert view (simulated dual-screen) */}
      {alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <Siren className="h-5 w-5" /> Emergency Alert
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.slice(-1).map((alert, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-semibold">{alert.user_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  <span>Lat: {alert.lat}, Lng: {alert.lng}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  <span>{alert.nearest_police_station}</span>
                </div>
                {alert.host_name && (
                  <div className="text-sm text-muted-foreground">
                    Host: {alert.host_name} · {alert.host_phone}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive">
                    <Phone className="h-3 w-3 mr-1" /> Call User
                  </Button>
                  <Button size="sm" variant="outline">
                    <MapPin className="h-3 w-3 mr-1" /> Navigate
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
