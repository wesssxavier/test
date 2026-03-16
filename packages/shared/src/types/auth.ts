export enum UserRole {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEW_ONLY = 'VIEW_ONLY',
  CHECK_IN_ONLY = 'CHECK_IN_ONLY',
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UserEventPermission {
  id: string;
  userId: string;
  eventId: string;
  role: UserRole;
  createdAt: string;
}
