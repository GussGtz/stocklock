import { Module } from '@nestjs/common';
import { CfdiController } from './cfdi.controller';
import { CfdiService } from './cfdi.service';
import { ContadigitalApiService } from './contadigital-api.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CfdiController],
  providers: [CfdiService, ContadigitalApiService],
  exports: [CfdiService],
})
export class CfdiModule {}
