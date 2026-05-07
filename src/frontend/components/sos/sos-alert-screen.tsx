"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Siren, Phone, MapPin, Shield } from "lucide-react";

interface SOSAlertScreenProps {
  alert: {
    user_name: string;
    lat: number;
    lng: number;
    nearest_police_station: string;
    police_phone?: string;
    host_name?: string;
    host_phone?: string;
    timestamp: string;
  };
  onCallUser: () => void;
  onNavigate: () => void;
}

export function SOSAlertScreen({ alert, onCallUser, onNavigate }: SOSAlertScreenProps) {
  return (
    <Card className="border-destructive bg-destructive/5 animate-pulse">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <Siren className="h-5 w-5" /> Emergency Alert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="font-semibold text-lg">{alert.user_name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              Lat: {alert.lat?.toFixed(4)}, Lng: {alert.lng?.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>{alert.nearest_police_station}</span>
          </div>
          {alert.police_phone && (
            <p className="text-sm text-muted-foreground">
              Police: {alert.police_phone}
            </p>
          )}
          {alert.host_name && (
            <p className="text-sm">
              Host: {alert.host_name} · {alert.host_phone}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {new Date(alert.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={onCallUser}>
            <Phone className="h-3 w-3 mr-1" /> Call User
          </Button>
          <Button size="sm" variant="outline" onClick={onNavigate}>
            <MapPin className="h-3 w-3 mr-1" /> Navigate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
