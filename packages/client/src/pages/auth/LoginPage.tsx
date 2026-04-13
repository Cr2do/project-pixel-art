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
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema';

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const user = await login(data);
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
            <CardTitle className="text-2xl">Connexion</CardTitle>
            <CardDescription>
              Compte de démo&nbsp;:{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                admin@pixel-art.dev
              </code>{' '}
              /{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                admin123
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Connexion…' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <Link to="/register" className="text-primary hover:underline">
                Créer un compte
              </Link>
              <Link to="/forgot-password" className="text-muted-foreground hover:text-primary hover:underline">
                Mot de passe oublié ?
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

export default LoginPage;
