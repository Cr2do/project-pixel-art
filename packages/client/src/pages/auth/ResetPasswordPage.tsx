import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { resetPasswordSchema, type ResetPasswordFormData } from '@/schemas/auth.schema';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { resetPassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setServerError('Lien invalide.');
      return;
    }
    setServerError(null);
    try {
      await resetPassword({ token, password: data.password });
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Choisissez un nouveau mot de passe pour votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ControlledInput
              control={control}
              name="password"
              label="Nouveau mot de passe"
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
              {isSubmitting ? 'Réinitialisation...' : 'Réinitialiser'}
            </Button>
          </form>
          <div className="mt-4 text-sm">
            <Link to="/login" className="text-primary hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ResetPasswordPage;
