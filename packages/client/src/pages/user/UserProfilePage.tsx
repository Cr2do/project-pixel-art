import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { ROLE_LABEL, getUserInitials } from '@/utils/user.utils';
import { formatDateFR } from '@/utils/date.utils';
import * as userService from '@/services/user.service';
import { getApiError } from '@/services/api.utils';
import { updateProfileSchema, type UpdateProfileFormData } from './user.schema';

function UserProfilePage() {
  const { user } = useAuth();
  const initials = user ? getUserInitials(user.firstname, user.lastname) : '';
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstname: user?.firstname ?? '',
      lastname: user?.lastname ?? '',
      email: user?.email ?? '',
    },
  });

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      await userService.updateMe(data);
      toast.success('Profil mis à jour avec succès.');
      setIsEditing(false);
    } catch (err) {
      toast.error(getApiError(err));
    }
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
              <Badge variant="secondary">
                {user ? ROLE_LABEL[user.role as UserRole] : ''}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {user ? `Membre depuis ${formatDateFR(user.createdAt)}` : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                {isEditing ? 'Modifiez vos informations ci-dessous.' : 'Vos informations de compte.'}
              </CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
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
              <div className="space-y-2">
                <Label htmlFor="firstname">Prénom</Label>
                <Input id="firstname" disabled={!isEditing} {...register('firstname')} />
                {errors.firstname && <p className="text-sm text-destructive">{errors.firstname.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastname">Nom</Label>
                <Input id="lastname" disabled={!isEditing} {...register('lastname')} />
                {errors.lastname && <p className="text-sm text-destructive">{errors.lastname.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" disabled={!isEditing} {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 size-4" />
                  {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
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
