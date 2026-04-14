import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères'),
  width: z
    .number({ invalid_type_error: 'Largeur requise' })
    .int()
    .min(5, 'Minimum 5 pixels')
    .max(500, 'Maximum 500 pixels'),
  height: z
    .number({ invalid_type_error: 'Hauteur requise' })
    .int()
    .min(5, 'Minimum 5 pixels')
    .max(500, 'Maximum 500 pixels'),
  delay_seconds: z
    .number({ invalid_type_error: 'Délai invalide' })
    .int()
    .min(0, 'Minimum 0 seconde')
    .max(3600, 'Maximum 3600 secondes'),
  allow_override: z.boolean(),
  endAt: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: 'Date de fin invalide',
    }),
});

export type CreateBoardFormData = z.infer<typeof createBoardSchema>;

export const updateProfileSchema = z.object({
  firstname: z
    .string()
    .min(1, 'Le prénom est requis')
    .max(50, 'Le prénom ne doit pas dépasser 50 caractères'),
  lastname: z
    .string()
    .min(1, 'Le nom est requis')
    .max(50, 'Le nom ne doit pas dépasser 50 caractères'),
  email: z
    .string()
    .min(1, "L'email est requis")
    .email("L'email n'est pas valide"),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
