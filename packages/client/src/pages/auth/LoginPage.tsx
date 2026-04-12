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
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <CardDescription>
            Compte admin : admin@pixel-art.dev / admin123
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
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>
          <div className="flex justify-between mt-4 text-sm">
            <Link to="/register" className="text-primary hover:underline">
              Créer un compte
            </Link>
            <Link to="/forgot-password" className="text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
