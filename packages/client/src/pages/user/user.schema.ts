import { z } from 'zod';

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
