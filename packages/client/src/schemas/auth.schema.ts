import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Za-z]/, 'Le mot de passe doit contenir au moins une lettre')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre');

export const loginSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("L'email n'est pas valide"),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const registerSchema = z
  .object({
    firstname: z
      .string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne doit pas dépasser 50 caractères'),
    lastname: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne doit pas dépasser 50 caractères'),
    email: z.string().min(1, "L'email est requis").email("L'email n'est pas valide"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "L'email est requis").email("L'email n'est pas valide"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
