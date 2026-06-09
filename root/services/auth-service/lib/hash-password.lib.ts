const bcrypt = require('bcrypt');

/**
 * Strategy (Behavioral): the hashing algorithm lives behind an interface so it
 * can be swapped without touching callers. `BcryptHasher` is the default
 * concrete strategy; the exported helpers delegate to it.
 */
export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

export class BcryptHasher implements PasswordHasher {
  constructor(private readonly saltRounds: number = 10) {}

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}

const defaultHasher: PasswordHasher = new BcryptHasher(10);

export async function hashPassword(password: string): Promise<string> {
  return defaultHasher.hash(password);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return defaultHasher.compare(password, hash);
}
