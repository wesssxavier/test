import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      token: this.jwtService.sign(payload),
      user,
    };
  }

  async createUser(data: { username: string; password: string; displayName: string; email: string; role?: string }) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
    });
    if (existing) throw new ConflictException('Username or email already exists');

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        password: hashed,
        displayName: data.displayName,
        email: data.email,
        role: (data.role as any) || 'EDITOR',
      },
    });
    const { password: _, ...result } = user;
    return result;
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true, username: true, displayName: true, email: true,
        role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
  }

  async updateUser(id: string, data: { displayName?: string; email?: string; role?: string; isActive?: boolean; password?: string }) {
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, username: true, displayName: true, email: true,
        role: true, isActive: true, createdAt: true, updatedAt: true,
      },
    });
    return user;
  }
}
