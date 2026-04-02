import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController, QuotesPdfController } from './quotes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuotesController, QuotesPdfController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
