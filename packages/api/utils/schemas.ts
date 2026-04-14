import { z } from 'zod';

export const RegisterSchema = z.object({
  lastname:  z.string().min(1, 'Le nom est requis').trim(),
  firstname: z.string().min(1, 'Le prénom est requis').trim(),
  email:     z.email('Email invalide').toLowerCase(),
  password:  z.string().min(8, 'Minimum 8 caractères'),
});

export const LoginSchema = z.object({
  email:    z.email('Email invalide').toLowerCase(),
  password: z.string().min(1, 'Mot de passe requis'),
});

export const ForgotPasswordSchema = z.object({
  email: z.email('Email invalide').toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(8, 'Minimum 8 caractères'),
});

export const UpdateUserSchema = z.object({
  lastname:  z.string().min(1).trim().optional(),
  firstname: z.string().min(1).trim().optional(),
  email:     z.email().toLowerCase().optional(),
  password:  z.string().min(8).optional(),
});

export const PlacePixelSchema = z.object({
  position_x: z.number().int().min(0),
  position_y: z.number().int().min(0),
  color:      z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Format hex requis (#RRGGBB)'),
});

export const ReplayQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50000).default(5000),
  offset: z.coerce.number().int().min(0).default(0),
});

export const UploadImageContributionSchema = z.object({
  offset_x: z.coerce.number().int().min(0).default(0),
  offset_y: z.coerce.number().int().min(0).default(0),
  maxPixels: z.coerce.number().int().min(1).max(200000).default(50000),
});

export const CreatePixelBoardSchema = z.object({
  name:           z.string().min(1).max(255),
  width:          z.number().int().min(1).max(1000),
  height:         z.number().int().min(1).max(1000),
  delay_seconds:  z.number().int().min(0).default(60),
  allow_override: z.boolean().default(false),
  status:         z.enum(['IN_PROGRESS', 'FINISHED']).default('IN_PROGRESS'),
  endAt:          z.coerce.date().optional(),
});

export const UpdatePixelBoardSchema = CreatePixelBoardSchema.partial();

export type RegisterInput         = z.infer<typeof RegisterSchema>;
export type LoginInput            = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput   = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput    = z.infer<typeof ResetPasswordSchema>;
export type UpdateUserInput       = z.infer<typeof UpdateUserSchema>;
export type PlacePixelInput       = z.infer<typeof PlacePixelSchema>;
export type ReplayQueryInput      = z.infer<typeof ReplayQuerySchema>;
export type UploadImageContributionInput = z.infer<typeof UploadImageContributionSchema>;
export type CreatePixelBoardInput = z.infer<typeof CreatePixelBoardSchema>;
export type UpdatePixelBoardInput = z.infer<typeof UpdatePixelBoardSchema>;
