import { z } from "zod";

export const phoneSchema = z.string().regex(/^\+91\d{10}$/, "Enter valid Indian mobile (+91...)");
export const otpSchema = z.string().regex(/^\d{6}$/, "Enter 6-digit OTP");

export const signupFormSchema = z.object({
  phone: phoneSchema,
});

export const otpFormSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

export const profileFormSchema = z.object({
  name: z.string().min(2).optional(),
  home_area: z.string().optional(),
  travel_radius_km: z.number().min(1).max(50).optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: phoneSchema.optional(),
  women_only_preference: z.boolean().optional(),
  screen_time_before: z.number().min(0).optional(),
});

export const chatMessageSchema = z.object({
  content: z.string().min(1).max(2000),
});

export const sosTriggerSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});
