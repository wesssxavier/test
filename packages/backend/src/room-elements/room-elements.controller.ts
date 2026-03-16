import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoomElementsService } from './room-elements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/room-elements')
export class RoomElementsController {
  constructor(private roomElementsService: RoomElementsService) {}

  @Get()
  async findAll(@Param('eventId') eventId: string) {
    const elements = await this.roomElementsService.findByEvent(eventId);
    return { data: elements };
  }

  @Post()
  async create(@Param('eventId') eventId: string, @Body() body: any) {
    const element = await this.roomElementsService.create({ ...body, eventId });
    return { data: element };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const element = await this.roomElementsService.update(id, body);
    return { data: element };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.roomElementsService.remove(id);
    return { data: result };
  }
}
