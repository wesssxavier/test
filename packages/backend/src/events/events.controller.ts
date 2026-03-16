import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  async findAll() {
    const events = await this.eventsService.findAll();
    return { data: events };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const event = await this.eventsService.findOne(id);
    return { data: event };
  }

  @Post()
  async create(@Body() body: any, @Request() req: any) {
    const event = await this.eventsService.create(body, req.user.id);
    return { data: event };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const event = await this.eventsService.update(id, body);
    return { data: event };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.eventsService.remove(id);
    return { data: { success: true } };
  }
}
