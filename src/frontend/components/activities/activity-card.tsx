"use client";

import Link from "next/link";
import { Calendar, MapPin, Users, ShieldOff } from "lucide-react";
import { format } from "date-fns";
import { getActivityImage } from "@/lib/images";

interface ActivityCardProps {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  area: string | null;
  scheduled_at: string;
  group_size_min: number;
  group_size_max: number;
  participant_count: number;
  phone_free_encouraged: boolean;
}

export function ActivityCard({ 
  id, title, category, area, scheduled_at, participant_count, phone_free_encouraged 
}: ActivityCardProps) {
  
  const bgImage = getActivityImage(title, category);
  const formattedCategory = category ? category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : "";


  return (
    <Link href={`/activities/${id}`}>
      <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full group">
        
        {/* Image/Banner Section */}
        <div 
          className="h-[180px] w-full relative flex flex-col justify-end bg-gray-100 bg-cover bg-center overflow-hidden"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" 
            style={{ backgroundImage: `url('${bgImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          
          {/* Top Left Badge */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md rounded-full px-3 py-1 shadow-sm">
            <span className="text-[11px] font-bold text-[#1e3a5f] tracking-wide">{formattedCategory}</span>
          </div>

          {/* Bottom Left Badge */}
          {phone_free_encouraged && (
            <div className="absolute bottom-4 left-4 bg-[#34c759] rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-md shadow-black/20">
              <ShieldOff className="w-3 h-3 text-white" />
              <span className="text-[10px] font-bold text-white tracking-wide">Phone-Free Zone</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-bold text-[#1e3a5f] text-[17px] leading-snug mb-4 line-clamp-2">{title}</h3>
          
          <div className="mt-auto space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-[15px] w-[15px] text-[#2cb1bc]" />
              <span className="text-[13px] font-medium text-[#1e3a5f]/60">
                {format(new Date(scheduled_at), "E, d MMM • h:mm a")}
              </span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <MapPin className="h-[15px] w-[15px] text-[#2cb1bc]" />
              <span className="text-[13px] font-medium text-[#1e3a5f]/60">{area}</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <Users className="h-[15px] w-[15px] text-[#2cb1bc]" />
              <span className="text-[13px] font-medium text-[#1e3a5f]/60">{participant_count} going</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

