import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/guests')
export class GuestsController {
  constructor(private guestsService: GuestsService) {}

  @Get()
  async findAll(@Param('eventId') eventId: string, @Query() query: any) {
    return this.guestsService.findByEvent(eventId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const guest = await this.guestsService.findOne(id);
    return { data: guest };
  }

  @Post()
  async create(@Param('eventId') eventId: string, @Body() body: any, @Request() req: any) {
    const guest = await this.guestsService.create({ ...body, eventId }, req.user.id);
    return { data: guest };
  }

  @Patch('bulk')
  async bulkUpdate(@Body() body: { guestIds: string[]; updates: any }, @Request() req: any) {
    const result = await this.guestsService.bulkUpdate(body.guestIds, body.updates, req.user.id);
    return { data: result };
  }

  @Delete('bulk')
  async bulkDelete(@Body() body: { guestIds: string[] }, @Request() req: any) {
    const result = await this.guestsService.bulkDelete(body.guestIds, req.user.id);
    return { data: result };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    const guest = await this.guestsService.update(id, body, req.user.id);
    return { data: guest };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const result = await this.guestsService.remove(id, req.user.id);
    return { data: result };
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') id: string, @Request() req: any) {
    const guest = await this.guestsService.duplicate(id, req.user.id);
    return { data: guest };
  }
}
