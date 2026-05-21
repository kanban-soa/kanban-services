export interface AuthUserDTO {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}
