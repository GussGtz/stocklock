import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcryptjs from 'bcryptjs';
import { Role } from '@prisma/client';

const DEMO_USERS = [
  { email: 'gerente@stocklock.com', firstName: 'Carlos', lastName: 'Gerente',   role: Role.MANAGER,   password: 'Demo123456!' },
  { email: 'almacen@stocklock.com', firstName: 'Luis',   lastName: 'Almacén',   role: Role.WAREHOUSE, password: 'Demo123456!' },
  { email: 'ventas@stocklock.com',  firstName: 'Ana',    lastName: 'Ventas',    role: Role.SALES,     password: 'Demo123456!' },
  { email: 'viewer@stocklock.com',  firstName: 'María',  lastName: 'Viewer',    role: Role.VIEWER,    password: 'Demo123456!' },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    for (const u of DEMO_USERS) {
      const exists = await this.prisma.user.findUnique({ where: { email: u.email } });
      if (!exists) {
        const hashed = await bcryptjs.hash(u.password, 10);
        await this.prisma.user.create({
          data: {
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            password: hashed,
            isActive: true,
          },
        });
        this.logger.log(`Demo user created: ${u.email} (${u.role})`);
      }
    }
  }
}
