import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Pencil, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ControlledInput } from '@/components/form/ControlledInput';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { ROLE_LABEL, getUserInitials } from '@/utils/user.utils';
import { formatDateFR } from '@/utils/date.utils';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '@/schemas/user.schema';

function UserProfilePage() {
  const { user } = useAuth();
  const initials = user ? getUserInitials(user.firstname, user.lastname) : '';
  const [isEditing, setIsEditing] = useState(false);

  const { control, handleSubmit, reset } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstname: user?.firstname ?? '',
      lastname: user?.lastname ?? '',
      email: user?.email ?? '',
    },
  });

  const onSubmit = (data: UpdateProfileFormData) => {
    // TODO: appel API pour sauvegarder
    console.log('Profile updated:', data);
    setIsEditing(false);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mon Profil</h2>
        <p className="text-muted-foreground">
          Consultez et modifiez vos informations personnelles.
        </p>
      </div>

      {/* Avatar + infos rapides */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-6">
          <Avatar className="size-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="text-xl font-semibold">
              {user?.firstname} {user?.lastname}
            </h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Badge variant="secondary">{user ? ROLE_LABEL[user.role as UserRole] : ''}</Badge>
              <span className="text-xs text-muted-foreground">
                {user ? `Membre depuis ${formatDateFR(user.createdAt)}` : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                {isEditing
                  ? 'Modifiez vos informations ci-dessous.'
                  : 'Vos informations de compte.'}
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-2 size-4" />
                Modifier
              </Button>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ControlledInput
                control={control}
                name="firstname"
                label="Prénom"
                disabled={!isEditing}
              />
              <ControlledInput
                control={control}
                name="lastname"
                label="Nom"
                disabled={!isEditing}
              />
            </div>

            <ControlledInput
              control={control}
              name="email"
              label="Email"
              type="email"
              disabled={!isEditing}
            />

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <Button type="submit">
                  <Save className="mr-2 size-4" />
                  Enregistrer
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  <X className="mr-2 size-4" />
                  Annuler
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserProfilePage;
