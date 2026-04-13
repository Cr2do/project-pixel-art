import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PixelLogo } from '@/components/common/PixelLogo';
import { useAuth } from '@/context/AuthContext';
import { forgotPasswordSchema, type ForgotPasswordFormData } from './auth.schema';

function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [resetPath, setResetPath] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    setSuccessMessage(null);
    setResetPath(null);
    try {
      const response = await forgotPassword(data.email);
      setSuccessMessage(response.message);
      setResetPath(response.resetPath ?? null);
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
            <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
            <CardDescription>
              Entrez votre email pour recevoir un lien de réinitialisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="vous@exemple.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              {serverError && (
                <p className="text-sm text-destructive">{serverError}</p>
              )}
              {successMessage && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {successMessage}
                </p>
              )}
              {resetPath && (
                <Link
                  to={resetPath}
                  className="block text-sm text-primary hover:underline"
                >
                  Ouvrir le lien de réinitialisation (mock)
                </Link>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Envoi…' : 'Envoyer le lien'}
              </Button>
            </form>

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

export default ForgotPasswordPage;
