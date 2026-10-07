import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CONFIG } from './config';

export type UserRole = 'PLAYER' | 'TEAM_OWNER' | 'ADMIN';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  teamId?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, CONFIG.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, CONFIG.JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function checkRole(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}
