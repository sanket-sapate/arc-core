import { z } from "zod";

export const roleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export type Role = z.infer<typeof roleSchema>;

export const permissionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
});

export type Permission = z.infer<typeof permissionSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  permission_ids: z.array(z.string()),
});

export type CreateRoleData = z.infer<typeof createRoleSchema>;
export type UpdateRoleData = CreateRoleData;

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role_id: z.string().uuid(),
  role_name: z.string(),
  created_at: z.string(),
});

export type User = z.infer<typeof userSchema>;

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role_id: z.string().min(1, "Role is required"),
});

export type InviteUserData = z.infer<typeof inviteUserSchema>;
