import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, run, get } from '../db';
import { config } from '../config';
import { User } from '../types';

export async function register(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  if (username.length < 3 || password.length < 6) {
    return { success: false, error: 'Username must be at least 3 characters and password at least 6 characters' };
  }

  const existingUser = await get<User>('SELECT id FROM users WHERE username = ?', [username]);
  if (existingUser) {
    return { success: false, error: 'Username already exists' };
  }

  const hashedPassword = bcrypt.hashSync(password, config.bcrypt.saltRounds);
  const result = await run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

  const token = jwt.sign({ userId: result.lastID, username }, config.jwt.secret as jwt.Secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
  return { success: true, token };
}

export async function login(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!username || !password) {
    return { success: false, error: 'Username and password are required' };
  }

  const user = await get<User>('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    return { success: false, error: 'Invalid username or password' };
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return { success: false, error: 'Invalid username or password' };
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, config.jwt.secret as jwt.Secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
  return { success: true, token };
}

export function verifyToken(token: string): { valid: boolean; userId?: number; username?: string; error?: string } {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: number; username: string };
    return { valid: true, userId: decoded.userId, username: decoded.username };
  } catch {
    return { valid: false, error: 'Invalid or expired token' };
  }
}

export async function getUserById(userId: number): Promise<User | undefined> {
  return await get<User>('SELECT id, username FROM users WHERE id = ?', [userId]);
}
