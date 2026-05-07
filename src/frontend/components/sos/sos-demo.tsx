"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Siren } from "lucide-react";

export function SOSDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="border-2 border-destructive/20">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Participant View
          </p>
          <div className="w-32 h-32 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Siren className="h-10 w-10 text-destructive" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Hold for 2 seconds</p>
        </CardContent>
      </Card>
      <Card className="border-2 border-destructive/20">
        <CardContent className="p-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Emergency Contact View
          </p>
          <div className="w-32 h-32 mx-auto rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
            <Siren className="h-10 w-10 text-destructive" />
          </div>
          <p className="text-xs text-destructive mt-2 font-semibold">
            Alert received in 2.1s
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            GPS · Police · Host Info
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
