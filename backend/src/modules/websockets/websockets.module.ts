import { Module } from '@nestjs/common';
import { StockGateway } from './stock.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
      }),
    }),
  ],
  providers: [StockGateway],
  exports: [StockGateway],
})
export class WebsocketsModule {}
