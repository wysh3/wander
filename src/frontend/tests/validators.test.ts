import { describe, it, expect } from "vitest";
import { phoneSchema, otpSchema, signupFormSchema, otpFormSchema, chatMessageSchema } from "@/lib/validators";

describe("phoneSchema", () => {
  it("accepts valid Indian phone", () => {
    expect(phoneSchema.safeParse("+919876543210").success).toBe(true);
    expect(phoneSchema.safeParse("+919999000001").success).toBe(true);
  });

  it("rejects invalid phones", () => {
    expect(phoneSchema.safeParse("9876543210").success).toBe(false);
    expect(phoneSchema.safeParse("+19876543210").success).toBe(false);
    expect(phoneSchema.safeParse("abc").success).toBe(false);
    expect(phoneSchema.safeParse("").success).toBe(false);
  });
});

describe("otpSchema", () => {
  it("accepts 6-digit OTP", () => {
    expect(otpSchema.safeParse("123456").success).toBe(true);
    expect(otpSchema.safeParse("000000").success).toBe(true);
    expect(otpSchema.safeParse("999999").success).toBe(true);
  });

  it("rejects non-6-digit OTP", () => {
    expect(otpSchema.safeParse("12345").success).toBe(false);
    expect(otpSchema.safeParse("1234567").success).toBe(false);
    expect(otpSchema.safeParse("abcdef").success).toBe(false);
  });
});

describe("signupFormSchema", () => {
  it("validates phone field", () => {
    const result = signupFormSchema.safeParse({ phone: "+919876543210" });
    expect(result.success).toBe(true);
    expect(result.data?.phone).toBe("+919876543210");
  });

  it("rejects missing phone", () => {
    expect(signupFormSchema.safeParse({}).success).toBe(false);
  });
});

describe("chatMessageSchema", () => {
  it("accepts valid message", () => {
    expect(chatMessageSchema.safeParse({ content: "Hello!" }).success).toBe(true);
  });

  it("rejects empty message", () => {
    expect(chatMessageSchema.safeParse({ content: "" }).success).toBe(false);
  });

  it("rejects message over 2000 chars", () => {
    expect(chatMessageSchema.safeParse({ content: "x".repeat(2001) }).success).toBe(false);
  });
});
