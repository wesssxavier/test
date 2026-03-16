import { Controller, Get, Post, Body, Param, Res, Query, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/exports')
export class ExportsController {
  constructor(private exportsService: ExportsService) {}

  @Post('guests')
  async exportGuests(
    @Param('eventId') eventId: string,
    @Body() body: { format?: string; columns?: string[]; filters?: Record<string, any>; includeCustomFields?: boolean },
    @Res() res: Response,
  ) {
    const format = (body.format as 'xlsx' | 'csv') || 'xlsx';
    const result = await this.exportsService.exportGuests(eventId, format, {
      columns: body.columns,
      filters: body.filters,
      includeCustomFields: body.includeCustomFields,
    });

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  @Get('guests/download')
  async downloadGuests(
    @Param('eventId') eventId: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    const fmt = (format as 'xlsx' | 'csv') || 'xlsx';
    const result = await this.exportsService.exportGuests(eventId, fmt);

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  @Get('seating/download')
  async downloadSeatingChart(
    @Param('eventId') eventId: string,
    @Res() res: Response,
  ) {
    const result = await this.exportsService.exportSeatingChart(eventId);

    res.set({
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }
}
