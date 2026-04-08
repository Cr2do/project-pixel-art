export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface IUser {
  _id: string;
  lastname: string;
  firstname: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateUserPayload {
  lastname?: string;
  firstname?: string;
  email?: string;
}
