import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SeriesService } from './series.service';
import { CreateSeriesDto } from './dto/create-series.dto';

@UseGuards(JwtAuthGuard)
@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Get()
  findAll() { return this.seriesService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.seriesService.findOne(id); }

  @Post()
  create(@Body() dto: CreateSeriesDto) { return this.seriesService.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateSeriesDto>) {
    return this.seriesService.update(id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) { return this.seriesService.toggle(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.seriesService.remove(id); }
}
