import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../users/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  getAlerts(@Request() req: any) {
    return this.alertsService.getAlerts(req.user.id);
  }

  @Patch('notifications/:id/read')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.alertsService.markAsRead(id, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  dismissAlert(@Param('id') id: string) {
    return this.alertsService.dismissAlert(id);
  }
}
