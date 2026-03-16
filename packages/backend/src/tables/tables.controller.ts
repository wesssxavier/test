import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/tables')
export class TablesController {
  constructor(private tablesService: TablesService) {}

  @Get()
  async findAll(@Param('eventId') eventId: string) {
    const tables = await this.tablesService.findByEvent(eventId);
    return { data: tables };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const table = await this.tablesService.findOne(id);
    return { data: table };
  }

  @Post()
  async create(@Param('eventId') eventId: string, @Body() body: any) {
    const table = await this.tablesService.create({ ...body, eventId });
    return { data: table };
  }

  @Post('bulk')
  async bulkCreate(@Param('eventId') eventId: string, @Body() body: { tables: any[] }) {
    const tables = await this.tablesService.bulkCreate(eventId, body.tables);
    return { data: tables };
  }

  @Patch('positions')
  async bulkUpdatePositions(@Body() body: { updates: { id: string; xPosition: number; yPosition: number; rotation?: number }[] }) {
    const results = await this.tablesService.bulkUpdatePositions(body.updates);
    return { data: results };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const table = await this.tablesService.update(id, body);
    return { data: table };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.tablesService.remove(id);
    return { data: result };
  }
}
