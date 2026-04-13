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
import { ControlledInput } from '@/components/ui/ControlledInput';
import { PixelLogo } from '@/components/common/PixelLogo';
import { useAuth } from '@/context/AuthContext';
import { resetPasswordSchema, type ResetPasswordFormData } from './auth.schema';

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { resetPassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
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
            <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
            <CardDescription>
              Choisissez un nouveau mot de passe pour votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  Mot de passe mis à jour avec succès !
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirection vers la connexion…
                </p>
              </div>
            ) : (
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
                  {isSubmitting ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
                </Button>
              </form>
            )}

            <div className="mt-4 text-sm">
              <Link to="/login" className="text-primary hover:underline">
                ← Retour à la connexion
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

export default ResetPasswordPage;
