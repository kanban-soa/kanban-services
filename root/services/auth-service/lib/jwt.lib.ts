import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload: { id: string; email: string | null; role?: string }) {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as any };
  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'user',
    },
    JWT_SECRET,
    options
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
