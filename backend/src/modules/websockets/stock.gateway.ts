import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/stock' })
export class StockGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(StockGateway.name);

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      client.join(`user:${payload.sub}`);
      client.join('stock-updates');
      client.emit('connected', {
        message: 'Conectado a StockLock en tiempo real',
        userId: payload.sub,
      });
      this.logger.log(
        `Client connected: ${client.id} (user: ${payload.sub})`,
      );
    } catch (error) {
      this.logger.warn(`Unauthorized connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @OnEvent('inventory.movement')
  handleInventoryMovement(data: any) {
    this.server.to('stock-updates').emit('inventory:movement', data);
  }

  @OnEvent('alert.created')
  handleAlert(data: any) {
    this.server.to(`user:${data.userId}`).emit('alert:new', data);
  }

  @OnEvent('sale.confirmed')
  handleSaleConfirmed(data: any) {
    this.server.to('stock-updates').emit('sale:confirmed', data);
  }

  @SubscribeMessage('join-warehouse')
  handleJoinWarehouse(
    @MessageBody() warehouseId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`warehouse:${warehouseId}`);
    client.emit('joined-warehouse', { warehouseId });
    this.logger.log(
      `Client ${client.id} joined warehouse room: ${warehouseId}`,
    );
  }

  @SubscribeMessage('leave-warehouse')
  handleLeaveWarehouse(
    @MessageBody() warehouseId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`warehouse:${warehouseId}`);
  }

  broadcastToWarehouse(warehouseId: string, event: string, data: any) {
    this.server.to(`warehouse:${warehouseId}`).emit(event, data);
  }

  broadcastStockUpdate(data: any) {
    this.server.to('stock-updates').emit('stock:update', data);
  }
}
