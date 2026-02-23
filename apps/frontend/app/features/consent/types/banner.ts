import { z } from "zod";

export const cookieBannerSchema = z.object({
  id: z.string().uuid().optional(),
  domain: z.string().min(3, "Domain is required (e.g., example.com)"),
  name: z.string().min(2, "Internal name is required"),
  title: z.string().min(2, "Banner title is required"),
  message: z.string().min(10, "Banner message must be at least 10 characters"),
  accept_button_text: z.string().default("Accept All"),
  reject_button_text: z.string().default("Reject All"),
  settings_button_text: z.string().default("Settings"),
  theme: z.enum(["light", "dark"]).default("light"),
  position: z.enum(["bottom", "top", "bottom-left", "bottom-right"]).default("bottom"),
  active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CookieBannerType = z.infer<typeof cookieBannerSchema>;

export interface CookieBanner extends CookieBannerType { }
