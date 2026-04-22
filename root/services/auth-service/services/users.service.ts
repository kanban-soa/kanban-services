import { db} from '@/auth-service/config/database';
import { users } from "@/auth-service/schema";
import { eq } from "drizzle-orm";
import { comparePassword, hashPassword } from "@/auth-service/lib";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
  image?: string;
}

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  return { valid: true };
}

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export class UsersService {

  static async getUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  static async getUserByEmail(email: string) {
    const sanitized = sanitizeEmail(email);
    const result = await db.select().from(users).where(eq(users.email, sanitized)).limit(1);
    return result[0] || null;
  }

  static async createUser(input: CreateUserInput) {
    const { email, password, name, image } = input;
    const sanitizedEmail = sanitizeEmail(email);

    if (!validateEmail(sanitizedEmail)) {
      throw new Error('Invalid email format');
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.error);
    }

    const existing = await this.getUserByEmail(sanitizedEmail);
    if (existing) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await hashPassword(password);

    const [created] = await db.insert(users).values({
      email: sanitizedEmail,
      password: hashedPassword,
      name: name?.trim() || null,
      image: image || null,
      emailVerified: false,
    }).returning();

    return created;
  }

  static async login(email: string, password: string): Promise<typeof users.$inferSelect> {
    const sanitizedEmail = sanitizeEmail(email);
    const user = await this.getUserByEmail(sanitizedEmail);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.password) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return user;
  }

  static async updateUser(id: string, data: Partial<Pick<CreateUserInput, 'name' | 'image'>>) {
    const existing = await this.getUserById(id);
    if (!existing) {
      throw new Error('User not found');
    }

    const [updated] = await db.update(users)
      .set({
        name: data.name?.trim() || existing.name,
        image: data.image || existing.image,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updated;
  }

  static async deleteUser(id: string): Promise<boolean> {
    const existing = await this.getUserById(id);
    if (!existing) {
      throw new Error('User not found');
    }

    await db.delete(users).where(eq(users.id, id));
    return true;
  }
}
