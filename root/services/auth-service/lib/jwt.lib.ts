import { TokenFactory, type TokenPayload } from './token.factory';

// Thin backward-compatible wrappers that delegate to the TokenFactory.
export function generateToken(payload: TokenPayload) {
  return TokenFactory.createAccessToken(payload);
}

export function verifyToken(token: string) {
  return TokenFactory.verify(token);
}
