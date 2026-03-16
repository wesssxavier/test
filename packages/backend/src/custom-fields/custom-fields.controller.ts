import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CustomFieldsService } from './custom-fields.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/custom-fields')
export class CustomFieldsController {
  constructor(private customFieldsService: CustomFieldsService) {}

  @Get()
  async findAll(@Param('eventId') eventId: string) {
    const fields = await this.customFieldsService.findByEvent(eventId);
    return { data: fields };
  }

  @Post()
  async create(@Param('eventId') eventId: string, @Body() body: any) {
    const field = await this.customFieldsService.create({ ...body, eventId });
    return { data: field };
  }

  @Patch('reorder')
  async reorder(@Body() body: { fieldIds: string[] }) {
    const result = await this.customFieldsService.reorder(body.fieldIds);
    return { data: result };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const field = await this.customFieldsService.update(id, body);
    return { data: field };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.customFieldsService.remove(id);
    return { data: result };
  }

  @Post('values')
  async setFieldValue(@Body() body: { guestId: string; fieldId: string; value: string }) {
    const result = await this.customFieldsService.setFieldValue(body.guestId, body.fieldId, body.value);
    return { data: result };
  }

  @Post('values/bulk')
  async bulkSetFieldValues(@Body() body: { guestIds: string[]; fieldId: string; value: string }) {
    const result = await this.customFieldsService.bulkSetFieldValues(body.guestIds, body.fieldId, body.value);
    return { data: result };
  }

  @Get('values/:guestId')
  async getFieldValues(@Param('guestId') guestId: string) {
    const values = await this.customFieldsService.getFieldValues(guestId);
    return { data: values };
  }
}
