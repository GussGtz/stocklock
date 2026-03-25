import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SectorsService } from './sectors.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { CreateTypeDto } from './dto/create-type.dto';

@ApiTags('sectors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sectors')
export class SectorsController {
  constructor(private sectorsService: SectorsService) {}

  @Get()
  findAll() { return this.sectorsService.findAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.sectorsService.findOne(id); }

  @Post()
  create(@Body() dto: CreateSectorDto) { return this.sectorsService.create(dto); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateSectorDto>) { return this.sectorsService.update(id, dto); }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) { return this.sectorsService.toggle(id); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.sectorsService.remove(id); }

  // Types endpoints
  @Get(':sectorId/types')
  findTypes(@Param('sectorId') sectorId: string) { return this.sectorsService.findTypes(sectorId); }

  @Post(':sectorId/types')
  createType(@Param('sectorId') sectorId: string, @Body() dto: CreateTypeDto) { return this.sectorsService.createType(sectorId, dto); }

  @Patch(':sectorId/types/:typeId')
  updateType(@Param('sectorId') sectorId: string, @Param('typeId') typeId: string, @Body() dto: Partial<CreateTypeDto>) {
    return this.sectorsService.updateType(sectorId, typeId, dto);
  }

  @Patch(':sectorId/types/:typeId/toggle')
  toggleType(@Param('sectorId') sectorId: string, @Param('typeId') typeId: string) {
    return this.sectorsService.toggleType(sectorId, typeId);
  }

  @Delete(':sectorId/types/:typeId')
  removeType(@Param('sectorId') sectorId: string, @Param('typeId') typeId: string) {
    return this.sectorsService.removeType(sectorId, typeId);
  }
}
