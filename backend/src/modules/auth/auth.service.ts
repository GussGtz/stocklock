import { Injectable, UnauthorizedException, BadRequestException, ServiceUnavailableException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcryptjs from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    let user: any;
    try {
      user = await this.prisma.user.findUnique({ where: { email } });
    } catch (err) {
      this.logger.error(`[LOGIN FAIL] type=${err.constructor?.name} email=${email} msg=${err.message}`);
      throw new ServiceUnavailableException('Servicio temporalmente no disponible, intente de nuevo en unos segundos');
    }
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');
    const valid = await bcryptjs.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('El email ya está registrado');

    const hashed = await bcryptjs.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { ...dto, password: hashed },
      select: {
        id: true, email: true, firstName: true,
        lastName: true, role: true, createdAt: true,
      },
    });
    return user;
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true,
        lastName: true, role: true, avatar: true,
        phone: true, lastLogin: true, createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
      },
      select: {
        id: true, email: true, firstName: true,
        lastName: true, role: true, avatar: true, phone: true,
      },
    });
  }

  async changePassword(userId: string, dto: { currentPassword: string; newPassword: string }) {
    return this.usersService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }
}
