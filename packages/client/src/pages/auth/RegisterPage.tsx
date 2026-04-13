import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ControlledInput } from '@/components/form/ControlledInput';
import { PixelLogo } from '@/components/common/PixelLogo';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { registerSchema, type RegisterFormData } from '@/schemas/auth.schema';

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, isAdmin } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const user = await register(data);
      navigate(user.role === UserRole.ADMIN ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/20">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Link to="/">
            <PixelLogo size="lg" />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Créer un compte</CardTitle>
            <CardDescription>
              Rejoignez la communauté et placez vos premiers pixels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ControlledInput
                  control={control}
                  name="firstname"
                  label="Prénom"
                  placeholder="Jean"
                />
                <ControlledInput
                  control={control}
                  name="lastname"
                  label="Nom"
                  placeholder="Dupont"
                />
              </div>
              <ControlledInput
                control={control}
                name="email"
                label="Email"
                type="email"
                placeholder="vous@exemple.com"
              />
              <ControlledInput
                control={control}
                name="password"
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
              />
              <ControlledInput
                control={control}
                name="confirmPassword"
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
              />
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Création…' : 'Créer mon compte'}
              </Button>
            </form>

            <div className="mt-4 text-sm">
              <Link to="/login" className="text-primary hover:underline">
                J'ai déjà un compte
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
