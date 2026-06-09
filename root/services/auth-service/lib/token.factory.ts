import jwt, { SignOptions } from 'jsonwebtoken';

// Read these lazily (at call time) rather than at module-load time. The secret
// is provided via dotenv, which only runs as an import side effect of other
// modules — capturing it at load time makes the value depend on import order
// and can silently fall back to the default, breaking JWT verification.
function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'your-secret-key';
}

function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}

export interface TokenPayload {
  id: string;
  email: string | null;
  role?: string;
  name?: string | null;
}

/**
 * Factory (Creational): centralises construction of signed JWTs. Callers ask
 * the factory for a token from a payload and stay unaware of the signing
 * options, secret, and default claims applied here.
 */
export class TokenFactory {
  static createAccessToken(payload: TokenPayload): string {
    const options: SignOptions = { expiresIn: getJwtExpiresIn() as any };
    return jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        name: payload.name || null,
        role: payload.role || 'user',
      },
      getJwtSecret(),
      options
    );
  }

  static verify(token: string) {
    return jwt.verify(token, getJwtSecret());
  }
}
