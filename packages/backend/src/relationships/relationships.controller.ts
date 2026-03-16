import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RelationshipsService } from './relationships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/relationships')
export class RelationshipsController {
  constructor(private relationshipsService: RelationshipsService) {}

  @Get()
  async findAll(@Param('eventId') eventId: string) {
    const relationships = await this.relationshipsService.findByEvent(eventId);
    return { data: relationships };
  }

  @Get('guest/:guestId')
  async findByGuest(@Param('guestId') guestId: string) {
    const relationships = await this.relationshipsService.findByGuest(guestId);
    return { data: relationships };
  }

  @Post()
  async create(@Param('eventId') eventId: string, @Body() body: any, @Request() req: any) {
    const rel = await this.relationshipsService.create({ ...body, eventId }, req.user.id);
    return { data: rel };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const result = await this.relationshipsService.remove(id, req.user.id);
    return { data: result };
  }
}
