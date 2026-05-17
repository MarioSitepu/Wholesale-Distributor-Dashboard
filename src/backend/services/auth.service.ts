import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import { Errors } from '../utils/errors';

// In-memory token blacklist untuk logout
const revokedTokens = new Set<string>();

export class AuthService {
  private userRepo = new UserRepository();

  async login(username: string, password: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) throw Errors.unauthorized('Username atau password salah');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw Errors.unauthorized('Username atau password salah');

    const payload = { username: user.username, role: user.role, branch: user.branch };
    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    return { token, user: payload };
  }

  async logout(token: string): Promise<void> {
    revokedTokens.add(token);
  }

  isRevoked(token: string): boolean {
    return revokedTokens.has(token);
  }
}
