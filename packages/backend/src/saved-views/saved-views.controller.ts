import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SavedViewsService } from './saved-views.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/saved-views')
export class SavedViewsController {
  constructor(private savedViewsService: SavedViewsService) {}

  @Get()
  async findAll(@Param('eventId') eventId: string) {
    const views = await this.savedViewsService.findByEvent(eventId);
    return { data: views };
  }

  @Post()
  async create(@Param('eventId') eventId: string, @Body() body: any, @Request() req: any) {
    const view = await this.savedViewsService.create({ ...body, eventId }, req.user.id);
    return { data: view };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const view = await this.savedViewsService.update(id, body);
    return { data: view };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.savedViewsService.remove(id);
    return { data: { success: true } };
  }
}
