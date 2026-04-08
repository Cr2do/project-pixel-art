import { UserRole } from '@/types';

export const ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.USER]: 'Utilisateur',
  [UserRole.ADMIN]: 'Administrateur',
};

export function getUserInitials(firstname: string, lastname: string): string {
  return `${firstname[0]}${lastname[0]}`.toUpperCase();
}
